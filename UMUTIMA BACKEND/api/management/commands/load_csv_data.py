"""
Management command to import real study data from CSV files in the data/ directory.
Imports studies.csv, study_resources.csv, and quality_report.csv.
"""
import csv
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from api.models import Study, StudyResource, QualityReport

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'data')

# Map study_type keywords to our domain choices
DOMAIN_MAP = {
    'agricultural': 'economic',
    'agriculture': 'economic',
    'food security': 'health',
    'nutrition': 'health',
    'demographic': 'health',
    'health': 'health',
    'dhs': 'health',
    'labour force': 'economic',
    'labor force': 'economic',
    'employment': 'economic',
    'manpower': 'economic',
    'enterprise': 'economic',
    'finscope': 'economic',
    'financial': 'economic',
    'establishment census': 'economic',
    'population': 'crossCutting',
    'census': 'crossCutting',
    'household living': 'crossCutting',
    'eicv': 'crossCutting',
    'child labour': 'crossCutting',
    'education': 'education',
    'service provision': 'health',
    'user satisfaction': 'crossCutting',
    'vision 2020': 'crossCutting',
    'seasonal agriculture': 'economic',
}

FILE_FORMAT_MAP = {
    'pdf': 'pdf',
    'xls': 'xlsx',
    'xlsx': 'xlsx',
    'doc': 'other',
    'docx': 'other',
    'zip': 'other',
    'file': 'other',
    'ppt': 'other',
    'pptx': 'pptx',
}

RESOURCE_TYPE_MAP = {
    'questionnaire': 'report',
    'report': 'report',
    'final report': 'report',
    'methodology': 'report',
    'manual': 'report',
    'dataset': 'dataset',
    'data': 'dataset',
    'presentation': 'presentation',
    'ppt': 'presentation',
    'policy brief': 'policy_brief',
    'brief': 'policy_brief',
    'infographic': 'infographic',
    'flyer': 'infographic',
    'brochure': 'infographic',
}


def infer_domain(title, study_type=''):
    text = (title + ' ' + study_type).lower()
    for keyword, domain in DOMAIN_MAP.items():
        if keyword in text:
            return domain
    return 'crossCutting'


def infer_resource_type(name):
    name_lower = name.lower()
    for keyword, rtype in RESOURCE_TYPE_MAP.items():
        if keyword in name_lower:
            return rtype
    return 'report'


def parse_quality_flags(flags_str):
    """Convert quality_flags CSV string to a quality score."""
    if not flags_str or flags_str.strip() == '':
        return 90.0, 'excellent'
    flags = [f.strip() for f in flags_str.split(';') if f.strip()]
    deductions = {
        'missing_study_type': 5,
        'missing_scope_notes': 5,
        'missing_abstract': 15,
        'missing_units_of_analysis': 10,
        'missing_get_microdata_url': 8,
        'missing_data_access_type': 8,
        'no_resources_found': 20,
        'generic_resource_type': 3,
    }
    score = 100.0
    for flag in flags:
        score -= deductions.get(flag, 5)
    score = max(0.0, score)
    if score >= 85:
        rating = 'excellent'
    elif score >= 70:
        rating = 'good'
    elif score >= 50:
        rating = 'fair'
    else:
        rating = 'poor'
    return score, rating


class Command(BaseCommand):
    help = 'Import real study data from CSV files in the data/ directory'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing study data before import')

    def handle(self, *args, **options):
        if options['clear']:
            Study.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared existing study data.'))

        studies_path = os.path.join(DATA_DIR, 'studies.csv')
        resources_path = os.path.join(DATA_DIR, 'study_resources.csv')
        quality_path = os.path.join(DATA_DIR, 'quality_report.csv')

        # ── 1. Load quality flags by study_id ────────────────────────────────
        quality_by_id = {}
        with open(quality_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                quality_by_id[row['study_id']] = {
                    'flags': row.get('quality_flags', ''),
                    'resource_count': int(row.get('resource_count', 0)),
                    'resource_quality_flags': row.get('resource_quality_flags', ''),
                }

        # ── 2. Load resources by study_id ─────────────────────────────────────
        resources_by_id = {}
        with open(resources_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row['study_id']
                if sid not in resources_by_id:
                    resources_by_id[sid] = []
                resources_by_id[sid].append(row)

        # ── 3. Import studies ─────────────────────────────────────────────────
        created_count = 0
        with open(studies_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                study_id = row['study_id']

                # Parse publication date
                year_str = row.get('year', '').strip()
                try:
                    pub_year = int(year_str) if year_str else 2000
                except ValueError:
                    pub_year = 2000
                pub_date = date(pub_year, 1, 1)

                # Infer domain
                domain = infer_domain(row.get('title', ''), row.get('study_type', ''))

                # Parse views as proxy for download_count
                try:
                    views = int(row.get('views', 0))
                except (ValueError, TypeError):
                    views = 0

                # Build abstract — use abstract field, fall back to overview_summary
                abstract = (row.get('abstract') or row.get('overview_summary') or '').strip()
                if len(abstract) > 2000:
                    abstract = abstract[:2000] + '...'

                # Keywords from scope_notes / study_type
                keywords = []
                study_type = row.get('study_type', '').strip()
                if study_type:
                    keywords.append(study_type)
                country = row.get('country', '').strip()
                if country:
                    keywords.append(country)

                # Organization
                org = row.get('organization', '').strip()
                if len(org) > 200:
                    org = org[:200]

                # Quality
                q_data = quality_by_id.get(study_id, {'flags': '', 'resource_count': 0})
                score, rating = parse_quality_flags(q_data['flags'])

                # Create or update study
                study, created = Study.objects.update_or_create(
                    id=int(study_id),
                    defaults={
                        'title': row.get('title', '')[:300],
                        'abstract': abstract or 'No abstract available.',
                        'domain': domain,
                        'authors': [org] if org else ['NISR'],
                        'organization': org or 'NISR',
                        'publication_date': pub_date,
                        'geographic_scope': row.get('geographic_coverage', 'National') or 'National',
                        'keywords': keywords,
                        'methodology': (row.get('kind_of_data') or row.get('study_type') or '')[:200],
                        'sample_size': None,
                        'status': 'completed',
                        'doi': row.get('id_number', '')[:200],
                    }
                )

                # Create quality report
                QualityReport.objects.update_or_create(
                    study=study,
                    defaults={
                        'overall_score': score,
                        'overall_rating': rating,
                        'completeness_score': max(0, score - 5 + (5 if not q_data['flags'] else 0)),
                        'accuracy_score': min(100, score + 3),
                        'timeliness_score': max(0, score - 8),
                        'consistency_score': max(0, score - 4),
                        'sex_disaggregated': 'dhs' in row.get('title', '').lower() or 'demographic' in row.get('title', '').lower(),
                        'age_disaggregated': 'dhs' in row.get('title', '').lower(),
                        'geographic_disaggregated': 'national' in (row.get('geographic_coverage') or '').lower(),
                        'disability_disaggregated': False,
                        'peer_reviewed': score >= 85,
                        'notes': q_data['flags'] or '',
                        'assessed_by': 'GDO Auto-Import',
                        'assessed_at': timezone.now(),
                    }
                )

                # Create resources
                study_resources = resources_by_id.get(study_id, [])
                StudyResource.objects.filter(study=study).delete()
                for res in study_resources:
                    name = res.get('name', res.get('filename', ''))
                    file_type = res.get('type', 'pdf').lower()
                    StudyResource.objects.create(
                        study=study,
                        title=name[:300] if name else 'Resource',
                        resource_type=infer_resource_type(name),
                        file_format=FILE_FORMAT_MAP.get(file_type, 'other'),
                        url=res.get('url', ''),
                        file_size_kb=None,
                        language='English',
                        description=res.get('label', name)[:500] if res.get('label') else name[:500],
                        is_public=True,
                        download_count=views // max(len(study_resources), 1),
                    )

                created_count += 1
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'{action}: [{study_id}] {study.title[:70]}')

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Import complete: {created_count} studies processed from CSV data.'
        ))
