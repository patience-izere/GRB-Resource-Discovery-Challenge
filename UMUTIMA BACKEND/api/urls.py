"""
API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    APIRootView,
    HealthCheckView,
    MetricsView,
    InsightsView,
    GapAlertsView,
    GapActionsView,
    IndicatorsListView,
    DetailedIndicatorView,
    StudyViewSet,
    CatalogStudiesView,
    SemanticSearchView,
)

router = DefaultRouter()
router.register(r'studies', StudyViewSet, basename='study')

urlpatterns = [
    path('', APIRootView.as_view(), name='api-root'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('indicators/', IndicatorsListView.as_view(), name='indicators-list'),
    path('indicators/metrics/', MetricsView.as_view(), name='metrics-list'),
    path('insights/', InsightsView.as_view(), name='insights-list'),
    path('gaps/alerts/', GapAlertsView.as_view(), name='gap-alerts-list'),
    path('gap-actions/', GapActionsView.as_view(), name='gap-actions'),
    path('indicators/<str:indicator_id>/detailed/', DetailedIndicatorView.as_view(), name='detailed-indicator'),
    path('catalog/', CatalogStudiesView.as_view(), name='catalog-studies'),
    path('search/', SemanticSearchView.as_view(), name='semantic-search'),
    path('', include(router.urls)),
]
