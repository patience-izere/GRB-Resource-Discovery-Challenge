import csv
import os

def add_microdata_login_column(filepath):
    """Add microdata_login_required column to studies CSV"""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames) if reader.fieldnames else []
        
        for row in reader:
            # Check if microdata URL requires login
            microdata_url = row.get('get_microdata_url', '')
            login_required = 'true' if 'microdata.statistics.gov.rw' in microdata_url.lower() else 'false'
            row['microdata_login_required'] = login_required
            rows.append(row)
    
    # Add the new field to fieldnames if not already there
    if 'microdata_login_required' not in fieldnames:
        fieldnames.append('microdata_login_required')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Added microdata_login_required to {filepath}")

add_microdata_login_column('data/studies.csv')
add_microdata_login_column('data/sample/studies.csv')
