import csv
import os

def remove_login_required_column(filepath):
    """Remove login_required column from study_resources CSV"""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = [fn for fn in reader.fieldnames if fn != 'login_required']
        
        for row in reader:
            # Remove the login_required key if it exists
            if 'login_required' in row:
                del row['login_required']
            rows.append(row)
    
    # Write back without login_required
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Removed login_required from {filepath}")

remove_login_required_column('data/study_resources.csv')
remove_login_required_column('data/sample/study_resources.csv')
