"""
URL configuration for DD Rw Portal backend.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/census/', include('census.urls')),
]
