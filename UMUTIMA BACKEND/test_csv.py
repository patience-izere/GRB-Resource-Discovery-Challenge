import csv

with open('data/study_resources.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    print(f'Fieldnames: {fieldnames}')
    # Try to read first row
    for i, row in enumerate(reader):
        if i == 0:
            print(f'First row keys: {list(row.keys())}')
            print(f'study_id value: {row.get("study_id", "NOT FOUND")}')
            print(f'login_required value: {row.get("login_required", "NOT FOUND")}')
        if i > 0:
            break
