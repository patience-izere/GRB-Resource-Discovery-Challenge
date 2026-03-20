#!/usr/bin/env python
import os
import sys
import json
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.request import Request
from api.views import CatalogStudiesView

factory = RequestFactory()
django_request = factory.get('/api/catalog/?stats=1')
request = Request(django_request)

view = CatalogStudiesView()
try:
    response = view.get(request)
    response.render()  # Render the response

    # Check the response
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        print(f'✓ API returned status 200')
        print(f'✓ Response type: {type(data).__name__}')
        
        if isinstance(data, dict):
            print(f'✓ Keys in response: {list(data.keys())[:5]}...')
        elif isinstance(data, list) and len(data) > 0:
            first_item = data[0]
            if 'resources' in first_item and len(first_item['resources']) > 0:
                first_res = first_item['resources'][0]
                print(f'✓ First resource: {first_res.get("label", first_res.get("name"))}')
                print(f'✓ Has login_required field: {"login_required" in first_res}')
                if 'login_required' in first_res:
                    print(f'✓ login_required value: {first_res["login_required"]}')
    else:
        print(f'✗ API returned status {response.status_code}')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
