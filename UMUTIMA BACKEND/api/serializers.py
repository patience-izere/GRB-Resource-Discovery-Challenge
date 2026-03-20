"""
Serializers for API endpoints
"""
from rest_framework import serializers
from .models import Metric, Insight, GapAlert, DetailedIndicator, ChartData, Study, StudyResource, QualityReport


class QualityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityReport
        fields = [
            'overall_score', 'overall_rating',
            'completeness_score', 'accuracy_score', 'timeliness_score', 'consistency_score',
            'sex_disaggregated', 'age_disaggregated', 'geographic_disaggregated', 'disability_disaggregated',
            'peer_reviewed', 'notes', 'assessed_by', 'assessed_at',
        ]


class StudyResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyResource
        fields = [
            'id', 'title', 'resource_type', 'file_format', 'url',
            'file_size_kb', 'language', 'description', 'is_public', 'download_count', 'created_at',
        ]


class StudyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""
    resource_count = serializers.SerializerMethodField()
    quality_score = serializers.SerializerMethodField()
    quality_rating = serializers.SerializerMethodField()

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'abstract', 'domain', 'organization', 'publication_date',
            'geographic_scope', 'keywords', 'methodology', 'status',
            'resource_count', 'quality_score', 'quality_rating',
        ]

    def get_resource_count(self, obj):
        return obj.resources.count()

    def get_quality_score(self, obj):
        if hasattr(obj, 'quality_report'):
            return obj.quality_report.overall_score
        return None

    def get_quality_rating(self, obj):
        if hasattr(obj, 'quality_report'):
            return obj.quality_report.overall_rating
        return None


class StudyDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested resources and quality report"""
    resources = StudyResourceSerializer(many=True, read_only=True)
    quality_report = QualityReportSerializer(read_only=True)
    resource_count = serializers.SerializerMethodField()

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'abstract', 'domain', 'authors', 'organization',
            'publication_date', 'geographic_scope', 'keywords', 'methodology',
            'sample_size', 'status', 'doi', 'resource_count', 'resources', 'quality_report',
            'created_at', 'updated_at',
        ]

    def get_resource_count(self, obj):
        return obj.resources.count()


class ChartDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartData
        fields = ['data']


class MetricSerializer(serializers.ModelSerializer):
    chart_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Metric
        fields = ['id', 'domain', 'title', 'value', 'trend', 'trend_direction', 'time_range', 'chart_data']
    
    def get_chart_data(self, obj):
        if hasattr(obj, 'chart_data'):
            return obj.chart_data.data
        return []


class InsightSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='insight_type')
    
    class Meta:
        model = Insight
        fields = ['id', 'type', 'headline']


class GapAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = GapAlert
        fields = ['id', 'title', 'description', 'severity']


class DetailedIndicatorSerializer(serializers.ModelSerializer):
    disaggregation = serializers.SerializerMethodField()
    regional_data = serializers.CharField(source='regional_data')
    trend_data = serializers.CharField(source='trend_data')
    last_updated = serializers.DateTimeField(format='%Y-%m-%d')
    
    class Meta:
        model = DetailedIndicator
        fields = ['id', 'title', 'domain', 'source', 'last_updated', 'trend_data', 'disaggregation', 'regional_data']
    
    def get_disaggregation(self, obj):
        return {
            'location': obj.disaggregation_location,
            'age': obj.disaggregation_age,
        }
