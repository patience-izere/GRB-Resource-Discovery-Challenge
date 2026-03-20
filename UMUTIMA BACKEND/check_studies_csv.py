#!/usr/bin/env python
import csv
import os

# Check studies.csv for microdata_login_required column
filepath = 'data/studies.csv'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    print(f'✓ Studies CSV fieldnames: {fieldnames}')
    print(f'✓ Has microdata_login_required: {"microdata_login_required" in fieldnames}')
    
    # Check first few rows with microdata
    for i, row in enumerate(reader):
        if i < 3 and row.get('get_microdata_url'):
            print(f'\nStudy {i}: {row["title"][:40]}')
            print(f'  - get_microdata_url: {row.get("get_microdata_url", "")[:50]}...')
            print(f'  - microdata_login_required: {row.get("microdata_login_required", "NOT FOUND")}')
        if i >= 5:
            break
