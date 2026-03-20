# DD Rw Portal — Backend Setup Guide

Step-by-step instructions for setting up the Django backend on Windows. For a one-click setup, run `setup.bat` from the `UMUTIMA BACKEND` directory.

## Prerequisites

- Python 3.10 or higher (`python --version`)
- pip (bundled with Python)
- The three CSV data files placed in `data/`:
  - `data/studies.csv`
  - `data/study_resources.csv`
  - `data/quality_report.csv`
- Optional: `data/census/rwanda_census_2022.db` for census search indexing

---

## Step 1 — Create a Virtual Environment

Run from inside the `UMUTIMA BACKEND` directory:

```bash
python -m venv venv
```

## Step 2 — Activate the Virtual Environment

```bash
venv\Scripts\activate
```

Your prompt will change to show `(venv)`. All subsequent commands assume the venv is active.

## Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

This installs Django, DRF, FAISS, sentence-transformers, torch, scikit-learn, google-generativeai, and all other dependencies listed in `requirements.txt`. The first run downloads the `all-MiniLM-L6-v2` model (~90 MB) on first use.

## Step 4 — Configure Environment Variables

Copy the example file:

```bash
copy .env.example .env.local
```

Open `.env.local` and set the following values:

| Variable | What to set |
| --- | --- |
| SECRET_KEY | Any long random string (required in production) |
| DEBUG | True for development |
| ALLOWED_HOSTS | localhost,127.0.0.1 |
| GEMINI_API_KEY | Your Google Gemini API key (get one from Google AI Studio) |
| CORS_ALLOWED_ORIGINS | `http://localhost:5173` (Vite frontend) |

> **Note:** The `.env.example` default for `CORS_ALLOWED_ORIGINS` is `http://localhost:3000`. Change it to `http://localhost:5173` to match the Vite dev server.

## Step 5 — Apply Database Migrations

```bash
python manage.py migrate
```

This creates `db.sqlite3` with all required tables (Metric, Study, StudyResource, QualityReport, Insight, GapAlert, DetailedIndicator, and all Django internals).

## Step 6 — Load Data

### Option A — Seed sample hardcoded data

Loads a small set of hardcoded metrics, insights, gap alerts, and indicators. Useful for a quick smoke test without needing the CSV files.

```bash
python manage.py seed_data
```

### Option B — Import from CSV files (recommended)

Imports the full study catalog from the three CSV files in `data/`. Creates Study, StudyResource, and QualityReport records with quality scores computed from quality flags.

```bash
python manage.py load_csv_data
```

To clear existing study data before importing (clean reimport):

```bash
python manage.py load_csv_data --clear
```

You can run both `seed_data` and `load_csv_data` — they populate different models and do not conflict.

## Step 7 — Build FAISS Search Indices

Required for the `/api/search/` semantic search endpoint to work.

```bash
python manage.py build_search_index
```

This encodes all studies, metrics, indicators, insights, and gap alerts into FAISS vector indices under `indices/`. The first run downloads the sentence-transformer model if not already cached.

To build only specific indices:

```bash
python manage.py build_search_index --source studies metrics
```

To build the census index (requires `data/census/rwanda_census_2022.db`):

```bash
python manage.py build_search_index --source census
```

> **Note:** If you skip this step, `/api/search/` returns HTTP 503 with a message to run this command. The `/api/catalog/` endpoint works without indices.

## Step 8 — Create a Superuser (Optional)

Required to access the Django admin panel at `/admin/`.

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password.

## Step 9 — Start the Development Server

```bash
python manage.py runserver
```

The server starts at <http://localhost:8000>.

---

## Verification

### Health check

```bash
curl http://localhost:8000/api/health/
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-...",
  "message": "DD Rw Portal Backend API is running"
}
```

### API root

```bash
curl http://localhost:8000/api/
```

Returns a map of all available endpoints.

### Catalog (CSV-backed, no DB needed)

```bash
curl http://localhost:8000/api/catalog/?stats=1
```

Returns aggregate statistics: total studies, resources, quality scores, and data gaps.

### Study list (ORM-backed)

```bash
curl http://localhost:8000/api/studies/
```

Returns paginated studies loaded from the database. Empty if `load_csv_data` has not been run.

### Semantic search

```bash
curl "http://localhost:8000/api/search/?q=women+employment"
```

Returns ranked hits from FAISS. Returns HTTP 503 if indices have not been built.

### Admin panel

Open <http://localhost:8000/admin> and log in with your superuser credentials.

---

## Common Issues

### ModuleNotFoundError on startup

Virtual environment is not activated. Run:

```bash
venv\Scripts\activate
```

### Port already in use

Run on a different port:

```bash
python manage.py runserver 8001
```

### CORS errors in the browser

Ensure `CORS_ALLOWED_ORIGINS` in `.env.local` includes the exact origin of your frontend (including scheme, host, and port). For the Vite dev server: `http://localhost:5173`.

### Search returns HTTP 503

The FAISS indices have not been built yet. Run:

```bash
python manage.py build_search_index
```

### load_csv_data fails with FileNotFoundError

The CSV files are missing from `data/`. Place `studies.csv`, `study_resources.csv`, and `quality_report.csv` in the `data/` directory relative to `manage.py`.

### django.db.utils.OperationalError: no such table

Migrations have not been applied. Run:

```bash
python manage.py migrate
```

---

## Typical Development Workflow

```bash
# Terminal 1 — backend
cd "UMUTIMA BACKEND"
venv\Scripts\activate
python manage.py runserver

# Terminal 2 — frontend (in the UMUTIMA directory)
cd UMUTIMA
npm run dev
```

Frontend: <http://localhost:5173> — Backend: <http://localhost:8000>

---

## Re-importing Data After CSV Updates

```bash
python manage.py load_csv_data --clear
python manage.py build_search_index --source studies
```

The `--clear` flag deletes all existing Study, StudyResource, and QualityReport records before importing.
