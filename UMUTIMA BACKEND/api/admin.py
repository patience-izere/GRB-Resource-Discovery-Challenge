"""
Admin configuration for API
"""
from django.contrib import admin
from .models import Metric, Insight, GapAlert, DetailedIndicator, ChartData, Study, StudyResource, QualityReport


@admin.register(Study)
class StudyAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'domain', 'organization', 'publication_date', 'status']
    list_filter = ['domain', 'status', 'publication_date']
    search_fields = ['title', 'abstract', 'organization', 'keywords']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(StudyResource)
class StudyResourceAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'study', 'resource_type', 'file_format', 'is_public', 'download_count']
    list_filter = ['resource_type', 'file_format', 'is_public', 'language']
    search_fields = ['title', 'description', 'study__title']
    readonly_fields = ['created_at']


@admin.register(QualityReport)
class QualityReportAdmin(admin.ModelAdmin):
    list_display = ['study', 'overall_rating', 'overall_score', 'peer_reviewed', 'assessed_at']
    list_filter = ['overall_rating', 'peer_reviewed', 'sex_disaggregated']
    search_fields = ['study__title', 'assessed_by']


@admin.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'domain', 'value', 'trend_direction']
    list_filter = ['domain', 'trend_direction']
    search_fields = ['title', 'id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChartData)
class ChartDataAdmin(admin.ModelAdmin):
    list_display = ['metric']
    search_fields = ['metric__title']


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    list_display = ['id', 'insight_type', 'headline', 'created_at']
    list_filter = ['insight_type', 'created_at']
    search_fields = ['headline', 'id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GapAlert)
class GapAlertAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'severity', 'created_at']
    list_filter = ['severity', 'created_at']
    search_fields = ['title', 'id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DetailedIndicator)
class DetailedIndicatorAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'domain', 'source', 'last_updated']
    list_filter = ['domain', 'last_updated']
    search_fields = ['title', 'id', 'source']
    readonly_fields = ['created_at', 'updated_at']
