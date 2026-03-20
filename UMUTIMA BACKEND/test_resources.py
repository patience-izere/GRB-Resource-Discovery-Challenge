#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.views import CatalogStudiesView

view = CatalogStudiesView()
try:
    resources_map = view._load_resources()
    print(f'✓ Successfully loaded {len(resources_map)} studies worth of resources')
    # Show first study ID and resources
    first_sid = list(resources_map.keys())[0]
    first_resources = resources_map[first_sid]
    print(f'First study ID ({first_sid}) has {len(first_resources)} resources:')
    for res in first_resources:
        print(f'  - {res["label"] or res["name"]} (login_required: {res.get("login_required", False)})')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
