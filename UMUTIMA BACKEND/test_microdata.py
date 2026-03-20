#!/usr/bin/env python
import os
import sys
import json
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.views import CatalogStudiesView

view = CatalogStudiesView()
try:
    resources_map = view._load_resources()
    print(f'✓ Resources loaded: {len(resources_map)} studies')
    
    # Now get the full studies with microdata_login_required
    from django.test import RequestFactory
    from rest_framework.request import Request
    
    factory = RequestFactory()
    django_request = factory.get('/api/catalog/')
    request = Request(django_request)
    
    response = view.get(request)
    
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        print(f'✓ API returned {len(data)} studies')
        
        # Find a study with microdata
        for study in data:
            if study.get('microdata_url'):
                print(f'\n✓ Study with microdata: {study["title"][:50]}')
                print(f'  - microdata_url: {study["microdata_url"][:60]}...')
                print(f'  - microdata_login_required: {study.get("microdata_login_required", "NOT FOUND")}')
                break
    else:
        print(f'✗ API returned status {response.status_code}')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
