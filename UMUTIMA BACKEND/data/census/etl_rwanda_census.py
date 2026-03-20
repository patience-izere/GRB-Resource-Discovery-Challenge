import pandas as pd
import sqlite3
import numpy as np
import re
from pathlib import Path

FILE = '/mnt/user-data/uploads/PHC5-2022_Main_Indicators.xlsx'
DB_PATH = '/home/claude/rwanda_census_2022.db'

# ── Geography hierarchy ───────────────────────────────────────────────────────
GEO_HIERARCHY = [
    ('Rwanda',            'country',  None),
    ('City of Kigali',    'province', 'Rwanda'),
    ('Nyarugenge',        'district', 'City of Kigali'),
    ('Gasabo',            'district', 'City of Kigali'),
    ('Kicukiro',          'district', 'City of Kigali'),
    ('Southern Province', 'province', 'Rwanda'),
    ('Nyanza',            'district', 'Southern Province'),
    ('Gisagara',          'district', 'Southern Province'),
    ('Nyaruguru',         'district', 'Southern Province'),
    ('Huye',              'district', 'Southern Province'),
    ('Nyamagabe',         'district', 'Southern Province'),
    ('Ruhango',           'district', 'Southern Province'),
    ('Muhanga',           'district', 'Southern Province'),
    ('Kamonyi',           'district', 'Southern Province'),
    ('Western Province',  'province', 'Rwanda'),
    ('Karongi',           'district', 'Western Province'),
    ('Rutsiro',           'district', 'Western Province'),
    ('Rubavu',            'district', 'Western Province'),
    ('Nyabihu',           'district', 'Western Province'),
    ('Ngororero',         'district', 'Western Province'),
    ('Rusizi',            'district', 'Western Province'),
    ('Nyamasheke',        'district', 'Western Province'),
    ('Northern Province', 'province', 'Rwanda'),
    ('Rulindo',           'district', 'Northern Province'),
    ('Gakenke',           'district', 'Northern Province'),
    ('Musanze',           'district', 'Northern Province'),
    ('Burera',            'district', 'Northern Province'),
    ('Gicumbi',           'district', 'Northern Province'),
    ('Eastern Province',  'province', 'Rwanda'),
    ('Rwamagana',         'district', 'Eastern Province'),
    ('Nyagatare',         'district', 'Eastern Province'),
    ('Gatsibo',           'district', 'Eastern Province'),
    ('Kayonza',           'district', 'Eastern Province'),
    ('Kirehe',            'district', 'Eastern Province'),
    ('Ngoma',             'district', 'Eastern Province'),
    ('Bugesera',          'district', 'Eastern Province'),
]

# aliases used in some tables
GEO_ALIASES = {
    'cok': 'City of Kigali',
    'city of kigali': 'City of Kigali',
    'southern province': 'Southern Province',
    'western province': 'Western Province',
    'northern province': 'Northern Province',
    'eastern province': 'Eastern Province',
    'south': 'Southern Province',
    'west': 'Western Province',
    'north': 'Northern Province',
    'east': 'Eastern Province',
}

# Build lookup: name → (geo_type, parent_name)
GEO_LOOKUP = {name.lower(): (gtype, parent)
              for name, gtype, parent in GEO_HIERARCHY}
GEO_LOOKUP.update({k: GEO_LOOKUP[v.lower()] for k, v in GEO_ALIASES.items()
                   if v.lower() in GEO_LOOKUP})


# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(s):
    """Convert a string to a safe SQLite column name."""
    if s is None or (isinstance(s, float) and np.isnan(s)):
        return ''
    s = str(s).strip()
    s = re.sub(r'[^\w\s]', ' ', s)
    s = re.sub(r'\s+', '_', s)
    s = s.lower().strip('_')
    return s[:55]  # cap length


def build_column_names(df_raw, header_row_indices):
    """
    Combine multi-row headers into single column names.

    Handles merged cells by forward-filling NaN horizontally within each row,
    then joins the non-duplicate parts from each row with '_'.
    """
    header_frame = df_raw.iloc[header_row_indices].copy()

    # Forward-fill NaN across columns (handles merged/spanned cells)
    filled = []
    for _, row in header_frame.iterrows():
        new_row = []
        last = None
        for v in row:
            is_nan = v is None or (isinstance(v, float) and np.isnan(v))
            if not is_nan and str(v).strip().lower() not in ('', 'nan'):
                last = str(v).strip()
            new_row.append(last)
        filled.append(new_row)

    n_cols = df_raw.shape[1]
    col_names = []
    for c in range(n_cols):
        parts = []
        seen = set()
        for row in filled:
            v = row[c] if c < len(row) else None
            if v:
                slug = slugify(v)
                if slug and slug not in seen:
                    parts.append(slug)
                    seen.add(slug)
        col = '_'.join(parts) if parts else f'col_{c}'
        col_names.append(col)

    # Deduplicate column names (SQLite requires unique names)
    counts = {}
    result = []
    for col in col_names:
        if col in counts:
            counts[col] += 1
            result.append(f'{col}_{counts[col]}')
        else:
            counts[col] = 0
            result.append(col)
    return result


def find_data_start(df_raw, geo_names_lower):
    """
    Find the first row index where actual data begins.

    Data rows have a known geo name (or numeric value) in column 1.
    Header rows contain labels like 'Province/District', 'NaN', 'Sex', etc.
    """
    for i in range(1, min(8, len(df_raw))):
        v = df_raw.iloc[i, 1]
        if v is None or (isinstance(v, float) and np.isnan(v)):
            continue
        v_str = str(v).strip().lower()
        if v_str in geo_names_lower:
            return i
        # Also accept rows whose col1 looks like a year (projection tables)
        if re.match(r'^\d{4}$', v_str):
            return i
    return 3  # safe fallback


def enrich_with_geo(df, geo_col='geo_name'):
    """Add geo_type and parent_name columns by looking up the geo name."""
    def lookup(name):
        if name is None or (isinstance(name, float) and np.isnan(name)):
            return pd.Series({'geo_type': None, 'geo_parent': None})
        key = str(name).strip().lower()
        info = GEO_LOOKUP.get(key, (None, None))
        return pd.Series({'geo_type': info[0], 'geo_parent': info[1]})

    enriched = df[geo_col].apply(lookup)
    df = df.copy()
    df.insert(1, 'geo_type', enriched['geo_type'])
    df.insert(2, 'geo_parent', enriched['geo_parent'])
    return df


def to_sql_table_name(sheet_name):
    """Convert sheet name like 'Table 3' to a SQL-safe name."""
    m = re.match(r'Table\s+(\d+)', sheet_name, re.IGNORECASE)
    if m:
        return f't{int(m.group(1)):03d}'
    return slugify(sheet_name)


# ── Main ETL ──────────────────────────────────────────────────────────────────

def create_geo_table(conn):
    conn.execute('DROP TABLE IF EXISTS geo')
    conn.execute('''
        CREATE TABLE geo (
            geo_id      INTEGER PRIMARY KEY,
            name        TEXT UNIQUE,
            geo_type    TEXT,
            parent_name TEXT,
            parent_id   INTEGER REFERENCES geo(geo_id)
        )
    ''')
    name_to_id = {}
    for i, (name, gtype, parent) in enumerate(GEO_HIERARCHY, start=1):
        parent_id = name_to_id.get(parent)
        conn.execute(
            'INSERT INTO geo VALUES (?,?,?,?,?)',
            (i, name, gtype, parent, parent_id)
        )
        name_to_id[name] = i
    conn.commit()
    print(f'  geo table: {len(GEO_HIERARCHY)} rows')


def process_table_contents(conn, df_raw):
    """Store the table-of-contents as a lookup table."""
    rows = []
    for _, row in df_raw.iterrows():
        v = row.iloc[2]
        if isinstance(v, str) and v.startswith('Table '):
            m = re.match(r'Table\s+(\d+)\s*:\s*(.+)', v)
            if m:
                rows.append((int(m.group(1)), m.group(2).strip()))

    conn.execute('DROP TABLE IF EXISTS table_index')
    conn.execute('CREATE TABLE table_index (table_num INTEGER PRIMARY KEY, description TEXT)')
    conn.executemany('INSERT INTO table_index VALUES (?,?)', rows)
    conn.commit()
    print(f'  table_index: {len(rows)} entries')


def process_data_sheet(conn, sheet_name, df_raw, geo_names_lower):
    """Parse one Excel data sheet and insert into SQLite."""
    sql_name = to_sql_table_name(sheet_name)

    # Drop col 0 — it only ever holds the merged title text (all other rows NaN)
    df = df_raw.drop(columns=df_raw.columns[0])

    # Detect where data rows start
    data_start = find_data_start(df, geo_names_lower)

    # Rows between title row and data_start are headers
    header_rows = list(range(1, data_start))
    col_names   = build_column_names(df, header_rows)

    # Slice out data rows; skip footer rows (footnotes are usually short text
    # rows with NaN in numeric columns)
    data = df.iloc[data_start:].copy()
    data.columns = col_names

    # Name first column consistently
    first_col = col_names[0]
    data = data.rename(columns={first_col: 'geo_name'})

    # Drop rows that are purely NaN or only have a footnote string
    data = data.dropna(subset=['geo_name'])
    data = data[data['geo_name'].apply(
        lambda x: not (isinstance(x, str) and x.startswith('['))
    )]

    # Enrich with geo_type and geo_parent
    data = enrich_with_geo(data, geo_col='geo_name')

    # Write to SQLite
    data.to_sql(sql_name, conn, if_exists='replace', index=False)
    print(f'  {sheet_name:12s} → {sql_name}  ({len(data)} rows × {len(data.columns)} cols)')
    return len(data)


def run_etl():
    print('Reading workbook...')
    all_sheets = pd.read_excel(FILE, sheet_name=None, header=None)

    geo_names_lower = {name.lower() for name, _, _ in GEO_HIERARCHY}
    geo_names_lower.update(GEO_ALIASES.keys())

    print(f'  {len(all_sheets)} sheets found\n')

    Path(DB_PATH).unlink(missing_ok=True)
    conn = sqlite3.connect(DB_PATH)

    print('Building geo dimension table...')
    create_geo_table(conn)

    print('\nProcessing Contents sheet...')
    process_table_contents(conn, all_sheets['Contents'])

    print('\nProcessing data tables...')
    total_rows = 0
    skipped = 0
    for sheet_name, df_raw in all_sheets.items():
        if sheet_name == 'Contents':
            continue
        try:
            total_rows += process_data_sheet(conn, sheet_name, df_raw, geo_names_lower)
        except Exception as e:
            print(f'  {sheet_name:12s} → SKIPPED ({e})')
            skipped += 1

    conn.close()
    size_mb = Path(DB_PATH).stat().st_size / 1_048_576
    print(f'\nDone. {total_rows:,} total rows, {skipped} skipped')
    print(f'Database: {DB_PATH}  ({size_mb:.1f} MB)')


if __name__ == '__main__':
    run_etl()
