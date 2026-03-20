from django.urls import path
from .views import (
    CensusOverviewView,
    CensusRegionalView,
    CensusSectorView,
    CensusProjectionsView,
    CensusDeviationsView,
    CensusVulnerabilityView,
    CensusTableIndexView,
    CensusExportView,
)

urlpatterns = [
    path('overview/', CensusOverviewView.as_view(), name='census-overview'),
    path('regional/', CensusRegionalView.as_view(), name='census-regional'),
    path('sectors/<str:sector>/', CensusSectorView.as_view(), name='census-sector'),
    path('projections/', CensusProjectionsView.as_view(), name='census-projections'),
    path('deviations/', CensusDeviationsView.as_view(), name='census-deviations'),
    path('vulnerability/', CensusVulnerabilityView.as_view(), name='census-vulnerability'),
    path('tables/', CensusTableIndexView.as_view(), name='census-tables'),
    path('export/csv/', CensusExportView.as_view(), name='census-export-csv'),
]
