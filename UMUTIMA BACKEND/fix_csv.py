import csv
import os

def fix_csv_file(filepath):
    """Fix CSV file by removing BOM and fixing column names"""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    # Read the file
    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:  # utf-8-sig removes BOM automatically
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Clean up field names by removing quotes
        cleaned_fieldnames = [fn.strip('"') if fn else fn for fn in fieldnames]
        
        print(f"Original fieldnames: {fieldnames}")
        print(f"Cleaned fieldnames: {cleaned_fieldnames}")
        
        for row in reader:
            rows.append(row)
    
    # Write back with cleaned headers
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=cleaned_fieldnames)
        writer.writeheader()
        
        for row in rows:
            # Create a new dict with cleaned keys
            cleaned_row = {}
            for old_key, value in row.items():
                new_key = old_key.strip('"') if old_key else old_key
                cleaned_row[new_key] = value
            writer.writerow(cleaned_row)
    
    print(f"✓ Fixed {filepath}")

# Fix both CSV files
fix_csv_file('data/study_resources.csv')
fix_csv_file('data/sample/study_resources.csv')
