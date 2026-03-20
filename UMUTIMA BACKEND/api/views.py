"""
API Views
"""
import csv
import json
import os
from pathlib import Path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from django.db.models import Q
from datetime import datetime
from .models import Metric, Insight, GapAlert, DetailedIndicator, Study, StudyResource, QualityReport
from .serializers import (
    MetricSerializer, InsightSerializer, GapAlertSerializer, DetailedIndicatorSerializer,
    StudyListSerializer, StudyDetailSerializer, StudyResourceSerializer,
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


class StudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Studies with nested resources and quality reports"""
    queryset = Study.objects.prefetch_related('resources', 'quality_report').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudyDetailSerializer
        return StudyListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q', '').strip()
        domain = self.request.query_params.get('domain', '').strip()
        status_filter = self.request.query_params.get('status', '').strip()
        resource_type = self.request.query_params.get('resource_type', '').strip()
        quality_min = self.request.query_params.get('quality_min', '').strip()

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(abstract__icontains=q) |
                Q(organization__icontains=q) |
                Q(methodology__icontains=q) |
                Q(keywords__icontains=q) |
                Q(resources__title__icontains=q) |
                Q(resources__description__icontains=q)
            ).distinct()
        if domain:
            qs = qs.filter(domain=domain)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if resource_type:
            qs = qs.filter(resources__resource_type=resource_type).distinct()
        if quality_min:
            try:
                qs = qs.filter(quality_report__overall_score__gte=float(quality_min))
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=['get'], url_path='search')
    def unified_search(self, request):
        """Unified search across studies, resources, and quality reports"""
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'studies': [], 'resources': [], 'total': 0})

        studies = Study.objects.filter(
            Q(title__icontains=q) | Q(abstract__icontains=q) | Q(keywords__icontains=q)
        ).prefetch_related('resources', 'quality_report')[:10]

        resources = StudyResource.objects.filter(
            Q(title__icontains=q) | Q(description__icontains=q)
        ).select_related('study')[:10]

        return Response({
            'studies': StudyListSerializer(studies, many=True).data,
            'resources': StudyResourceSerializer(resources, many=True).data,
            'total': studies.count() + resources.count(),
        })


class CatalogStudiesView(APIView):
    """
    Serves studies directly from the CSV files in data/.
    Used as a fast fallback when the DB hasn't been seeded yet.
    Supports ?q=, ?year=, ?org= query params.
    """

    def _load_resources(self):
        resources = {}
        path = os.path.join(DATA_DIR, 'study_resources.csv')
        if not os.path.exists(path):
            return resources
        with open(path, encoding='utf-8') as f:
            for row in csv.DictReader(f):
                sid = row['study_id']
                if sid not in resources:
                    resources[sid] = []
                resources[sid].append({
                    'name': row.get('name', row.get('filename', '')),
                    'type': row.get('type', 'pdf'),
                    'url': row.get('url', ''),
                    'label': row.get('label', ''),
                })
        return resources

    def _load_quality(self):
        quality = {}
        path = os.path.join(DATA_DIR, 'quality_report.csv')
        if not os.path.exists(path):
            return quality
        with open(path, encoding='utf-8') as f:
            for row in csv.DictReader(f):
                quality[row['study_id']] = {
                    'quality_flags': row.get('quality_flags', ''),
                    'resource_count': int(row.get('resource_count', 0)),
                }
        return quality

    def _score(self, flags_str):
        if not flags_str:
            return 90.0, 'excellent'
        deductions = {
            'missing_study_type': 5, 'missing_scope_notes': 5,
            'missing_abstract': 15, 'missing_units_of_analysis': 10,
            'missing_get_microdata_url': 8, 'missing_data_access_type': 8,
            'no_resources_found': 20, 'generic_resource_type': 3,
        }
        score = 100.0
        for f in flags_str.split(';'):
            score -= deductions.get(f.strip(), 5)
        score = max(0.0, score)
        rating = 'excellent' if score >= 85 else 'good' if score >= 70 else 'fair' if score >= 50 else 'poor'
        return score, rating

    def get(self, request):
        q = request.query_params.get('q', '').lower().strip()
        year = request.query_params.get('year', '').strip()
        org = request.query_params.get('org', '').lower().strip()
        study_id = request.query_params.get('id', '').strip()
        stats_mode = request.query_params.get('stats', '').strip()

        resources_map = self._load_resources()
        quality_map = self._load_quality()

        path = os.path.join(DATA_DIR, 'studies.csv')
        if not os.path.exists(path):
            return Response({'error': 'studies.csv not found'}, status=404)

        all_studies = []
        with open(path, encoding='utf-8') as f:
            for row in csv.DictReader(f):
                sid = row['study_id']
                title = row.get('title', '')
                abstract = (row.get('abstract') or row.get('overview_summary') or '')[:500]
                organization = row.get('organization', '')[:200]
                row_year = row.get('year', '')
                geo = row.get('geographic_coverage') or 'National'
                methodology = row.get('kind_of_data') or row.get('study_type') or ''
                catalog_url = row.get('catalog_page') or row.get('url', '')
                qdata = quality_map.get(sid, {})
                score, rating = self._score(qdata.get('quality_flags', ''))
                res_list = resources_map.get(sid, [])
                study_obj = {
                    'id': sid, 'title': title, 'abstract': abstract,
                    'organization': organization, 'year': row_year,
                    'geographic_scope': geo, 'methodology': methodology[:200],
                    'catalog_url': catalog_url,
                    'microdata_url': row.get('get_microdata_url', ''),
                    'microdata_login_required': row.get('microdata_login_required', 'false').lower() == 'true',
                    'data_access_type': row.get('data_access_type', ''),
                    'study_type': row.get('study_type', ''),
                    'id_number': row.get('id_number', ''),
                    'quality_score': score, 'quality_rating': rating,
                    'quality_flags': qdata.get('quality_flags', ''),
                    'resource_count': len(res_list),
                    'resources': res_list if study_id else [],
                    '_flags_raw': qdata.get('quality_flags', ''),
                    '_full_text': ' '.join(filter(None, [
                        row.get('abstract', ''), row.get('scope_notes', ''),
                        row.get('geographic_unit', ''), row.get('study_description', ''),
                        row.get('notes', ''),
                    ])),
                }
                all_studies.append(study_obj)

        # Coverage mode — district mention counts
        coverage_mode = request.query_params.get('coverage', '').strip()
        if coverage_mode:
            DISTRICTS = [
                'gasabo', 'nyarugenge', 'kicukiro',
                'burera', 'musanze', 'gakenke', 'gicumbi', 'rulindo',
                'nyagatare', 'gatsibo', 'kayonza', 'rwamagana', 'kirehe', 'ngoma', 'bugesera',
                'kamonyi', 'muhanga', 'ruhango', 'nyanza', 'huye', 'nyamagabe', 'gisagara', 'nyaruguru',
                'karongi', 'rutsiro', 'rubavu', 'nyabihu', 'ngororero', 'rusizi', 'nyamasheke',
            ]
            result = {d: {'study_count': 0, 'studies': [], 'years': [], 'study_types': set()} for d in DISTRICTS}

            for s in all_studies:
                # Combine all text fields for searching
                text = ' '.join(filter(None, [
                    s.get('title', ''),
                    s.get('abstract', ''),
                    s.get('geographic_scope', ''),
                    s.get('methodology', ''),
                    s.get('study_type', ''),
                    s.get('_full_text', ''),
                ])).lower()
                matched = False
                for d in DISTRICTS:
                    if d in text:
                        result[d]['study_count'] += 1
                        result[d]['studies'].append({
                            'id': s['id'],
                            'title': s['title'],
                            'year': s['year'],
                        })
                        if s['year']:
                            result[d]['years'].append(s['year'])
                        st = s.get('study_type') or s.get('methodology') or ''
                        if st:
                            result[d]['study_types'].add(st[:40])
                        matched = True

                # National-coverage studies count for all districts at half weight
                # (tracked separately so frontend can decide)
                geo = s.get('geographic_scope', '').lower()
                if 'national' in geo and not matched:
                    for d in DISTRICTS:
                        result[d]['study_count'] += 1
                        if s['year']:
                            result[d]['years'].append(s['year'])
                        st = s.get('study_type') or s.get('methodology') or ''
                        if st:
                            result[d]['study_types'].add(st[:40])

            # Compute max for normalization
            max_count = max((v['study_count'] for v in result.values()), default=1)

            output = {}
            for d, v in result.items():
                years_sorted = sorted(set(v['years']))
                output[d] = {
                    'study_count': v['study_count'],
                    'max_count': max_count,
                    'most_recent_year': years_sorted[-1] if years_sorted else '',
                    'oldest_year': years_sorted[0] if years_sorted else '',
                    'year_span': len(years_sorted),
                    'study_types': list(v['study_types']),
                    'studies': v['studies'][:5],  # top 5 for tooltip
                }
            return Response(output)

        # Stats mode
        if stats_mode:
            from collections import Counter
            type_counts = Counter()
            year_counts = Counter()
            total_resources = 0
            no_resources = 0
            missing_abstract = 0
            scores = []
            studies_no_resources = []
            studies_missing_abstract = []
            studies_incomplete = []
            
            for s in all_studies:
                st = s.get('study_type') or s.get('methodology') or 'Survey'
                # Simplify type label
                if 'demographic' in st.lower() or 'dhs' in s['title'].lower():
                    st = 'Demographic & Health'
                elif 'labour' in s['title'].lower() or 'labor' in s['title'].lower():
                    st = 'Labour Force'
                elif 'household' in s['title'].lower() or 'eicv' in s['title'].lower():
                    st = 'Household Survey'
                elif 'agricultural' in s['title'].lower() or 'agriculture' in s['title'].lower():
                    st = 'Agricultural'
                elif 'census' in s['title'].lower():
                    st = 'Census'
                elif 'finscope' in s['title'].lower() or 'financial' in s['title'].lower():
                    st = 'Financial Inclusion'
                elif 'food security' in s['title'].lower() or 'cfsva' in s['title'].lower():
                    st = 'Food Security'
                else:
                    st = 'Other'
                type_counts[st] += 1
                if s['year']:
                    year_counts[s['year']] += 1
                total_resources += s['resource_count']
                flags = s['_flags_raw']
                if 'no_resources_found' in flags:
                    no_resources += 1
                    studies_no_resources.append({'id': s['id'], 'title': s['title'], 'year': s['year'], 'organization': s['organization']})
                if 'missing_abstract' in flags:
                    missing_abstract += 1
                    studies_missing_abstract.append({'id': s['id'], 'title': s['title'], 'year': s['year'], 'organization': s['organization']})
                if len(s['_flags_raw'].split(';')) >= 2 and s['_flags_raw']:
                    studies_incomplete.append({'id': s['id'], 'title': s['title'], 'year': s['year'], 'organization': s['organization']})
                scores.append(s['quality_score'])

            recent = sorted(
                [s for s in all_studies if s['year']],
                key=lambda x: x['year'], reverse=True
            )[:6]

            gaps = []
            if no_resources > 0:
                gaps.append({
                    'title': f'{no_resources} Studies Missing Resources',
                    'description': f'{no_resources} studies in the catalog have no downloadable resources attached.',
                    'severity': 'critical',
                    'affectedStudies': studies_no_resources[:10]  # Top 10
                })
            if missing_abstract > 0:
                gaps.append({
                    'title': f'{missing_abstract} Studies Missing Abstracts',
                    'description': f'{missing_abstract} studies lack abstracts, reducing discoverability and usability.',
                    'severity': 'warning',
                    'affectedStudies': studies_missing_abstract[:10]  # Top 10
                })
            incomplete = len(studies_incomplete)
            if incomplete > 0:
                gaps.append({
                    'title': f'{incomplete} Studies with Metadata Gaps',
                    'description': 'Studies missing study type, scope notes, or access type fields.',
                    'severity': 'info',
                    'affectedStudies': studies_incomplete[:10]  # Top 10
                })

            return Response({
                'totalStudies': len(all_studies),
                'totalResources': total_resources,
                'studiesByType': [{'type': k, 'count': v} for k, v in type_counts.most_common()],
                'studiesByYear': [{'year': k, 'count': v} for k, v in sorted(year_counts.items())],
                'recentStudies': [{'id': s['id'], 'title': s['title'], 'year': s['year'], 'organization': s['organization'], 'resource_count': s['resource_count'], 'quality_score': round(s['quality_score']), 'quality_rating': s['quality_rating']} for s in recent],
                'dataGaps': gaps,
                'avgQualityScore': round(sum(scores) / len(scores), 1) if scores else 0,
                'studiesWithNoResources': no_resources,
                'studiesWithMissingAbstract': missing_abstract,
            })

        # Single study detail
        # Pre-split query into tokens so multi-word queries work (all tokens must match somewhere)
        q_tokens = q.split() if q else []

        results = []
        for s in all_studies:
            sid = s['id']
            if study_id and sid != study_id:
                continue
            if q_tokens:
                haystack = ' '.join(filter(None, [
                    s['title'].lower(),
                    s['abstract'].lower(),
                    s['organization'].lower(),
                    s.get('_full_text', '').lower(),
                    s.get('study_type', '').lower(),
                    s.get('geographic_scope', '').lower(),
                ]))
                if not all(token in haystack for token in q_tokens):
                    continue
            if year and s['year'] != year:
                continue
            if org and org not in s['organization'].lower():
                continue
            results.append(s)

        # Clean internal fields before returning
        for s in results:
            s.pop('_flags_raw', None)
            s.pop('_full_text', None)

        if study_id:
            if not results:
                return Response({'error': 'Study not found'}, status=404)
            return Response(results[0])

        return Response({'count': len(results), 'results': results})


class HealthCheckView(APIView):
    """Health check endpoint"""
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'message': 'DD Rw Portal Backend API is running'
        }, status=status.HTTP_200_OK)


class MetricsView(APIView):
    """Fetch all metrics for dashboard overview"""
    
    def get(self, request):
        metrics = Metric.objects.all()
        serializer = MetricSerializer(metrics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InsightsView(APIView):
    """Fetch AI-generated insights"""
    
    def get(self, request):
        insights = Insight.objects.all()
        serializer = InsightSerializer(insights, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GapAlertsView(APIView):
    """Fetch data gap alerts"""
    
    def get(self, request):
        alerts = GapAlert.objects.all()
        serializer = GapAlertSerializer(alerts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetailedIndicatorView(APIView):
    """Fetch detailed indicator data"""
    
    def get(self, request, indicator_id):
        try:
            indicator = DetailedIndicator.objects.get(id=indicator_id)
            serializer = DetailedIndicatorSerializer(indicator)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DetailedIndicator.DoesNotExist:
            return Response(
                {'error': 'Indicator not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class IndicatorsListView(APIView):
    """List all available indicators"""
    
    def get(self, request):
        indicators = DetailedIndicator.objects.all().values('id', 'title', 'domain')
        return Response({
            'count': len(indicators),
            'indicators': list(indicators)
        }, status=status.HTTP_200_OK)


class APIRootView(APIView):
    """API root endpoint with available endpoints"""
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'DD Rw Portal Backend API is running',
            'version': '1.0.0',
            'endpoints': {
                'health': request.build_absolute_uri('/api/health/'),
                'metrics': request.build_absolute_uri('/api/indicators/metrics/'),
                'insights': request.build_absolute_uri('/api/insights/'),
                'gaps': request.build_absolute_uri('/api/gaps/alerts/'),
                'detailed_indicator': request.build_absolute_uri('/api/indicators/{id}/detailed/'),
            },
            'admin': request.build_absolute_uri('/admin/'),
            'timestamp': datetime.now().isoformat(),
        }, status=status.HTTP_200_OK)


class GapActionsView(APIView):
    """Handle user submissions for gap actions (submit data, request update, correct info)"""
    
    def post(self, request):
        """Accept gap action submissions"""
        try:
            data = request.data
            action_type = data.get('action_type')  # 'submit', 'correct', 'request'
            gap_title = data.get('gap_title', '')
            affected_study_id = data.get('affected_study_id')
            affected_study_title = data.get('affected_study_title')
            message = data.get('message', '')
            email = data.get('email', '')
            name = data.get('name', '')
            timestamp = data.get('timestamp', datetime.now().isoformat())
            
            # Validate required fields
            if not all([action_type, gap_title, message, email, name]):
                return Response(
                    {'error': 'Missing required fields: action_type, gap_title, message, email, name'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log the submission to a file for now (can be replaced with database storage)
            log_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
            os.makedirs(log_dir, exist_ok=True)
            log_file = os.path.join(log_dir, 'gap_actions.log')
            
            log_entry = {
                'timestamp': timestamp,
                'action_type': action_type,
                'gap_title': gap_title,
                'affected_study_id': affected_study_id,
                'affected_study_title': affected_study_title,
                'message': message,
                'email': email,
                'name': name,
            }
            
            import json
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            return Response({
                'status': 'success',
                'message': f'{action_type.title()} request received and logged',
                'submission_time': timestamp,
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to process submission: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---------------------------------------------------------------------------
# Semantic Search
# ---------------------------------------------------------------------------

_SEARCH_HYDRATORS = {
    "studies":    lambda ids: Study.objects.filter(pk__in=ids),
    "metrics":    lambda ids: Metric.objects.filter(id__in=ids),
    "indicators": lambda ids: DetailedIndicator.objects.filter(id__in=ids),
    "insights":   lambda ids: Insight.objects.filter(id__in=ids),
    "gap_alerts": lambda ids: GapAlert.objects.filter(id__in=ids),
}

_CENSUS_RECORDS_PATH = Path(__file__).parent.parent / "indices" / "census_records.json"


def _serialize_hit(source: str, obj) -> dict:
    if source == "studies":
        return {"id": obj.pk, "title": obj.title, "abstract": obj.abstract[:200], "domain": obj.domain}
    if source == "metrics":
        return {"id": obj.id, "title": obj.title, "value": obj.value, "domain": obj.domain}
    if source == "indicators":
        return {"id": obj.id, "title": obj.title, "domain": obj.domain}
    if source == "insights":
        return {"id": obj.id, "headline": obj.headline, "description": obj.description[:200]}
    if source == "gap_alerts":
        return {"id": obj.id, "title": obj.title, "severity": obj.severity}
    return {}


class SemanticSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"error": "q parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Lazy import — model only loads when a search is actually performed
        try:
            from search.searcher import search as faiss_search
            from search.registry import SOURCES
        except ImportError:
            return Response(
                {"error": "Search engine not available. Run: pip install faiss-cpu sentence-transformers"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        all_sources = list(SOURCES.keys()) + ["census"]
        sources_param = request.query_params.get("sources", "")
        sources = [s for s in sources_param.split(",") if s in all_sources] or all_sources
        top_k = min(int(request.query_params.get("top_k", 20)), 50)

        from search.indexer import INDEX_DIR
        if not any((INDEX_DIR / f"{s}.index").exists() for s in sources if s != "census") and \
           not (INDEX_DIR / "census.index").exists():
            return Response(
                {"error": "Search indices not built yet. Run: python manage.py build_search_index"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        raw = faiss_search(query, sources, top_k)

        # Group by source for batch DB fetch
        grouped: dict = {}
        score_map: dict = {}
        for hit in raw:
            grouped.setdefault(hit["source"], []).append(hit["id"])
            score_map[f"{hit['source']}:{hit['id']}"] = hit["score"]

        results = []

        # Hydrate Django ORM sources
        for source, ids in grouped.items():
            if source == "census":
                if _CENSUS_RECORDS_PATH.exists():
                    with open(_CENSUS_RECORDS_PATH) as f:
                        census_store = json.load(f)
                    for cid in ids:
                        rec = census_store.get(cid)
                        if rec:
                            results.append({
                                "source": "census",
                                "score": score_map.get(f"census:{cid}", 0),
                                "data": {
                                    "id": cid,
                                    "title": rec.get("table_description", ""),
                                    "geo_name": rec.get("geo_name", ""),
                                    "geo_type": rec.get("geo_type", ""),
                                    "parent": rec.get("parent", ""),
                                },
                            })
                continue

            hydrator = _SEARCH_HYDRATORS.get(source)
            if not hydrator:
                continue
            for obj in hydrator(ids):
                results.append({
                    "source": source,
                    "score": score_map.get(f"{source}:{obj.pk}", 0),
                    "data": _serialize_hit(source, obj),
                })

        results.sort(key=lambda r: r["score"], reverse=True)
        return Response({"query": query, "total": len(results), "results": results})
