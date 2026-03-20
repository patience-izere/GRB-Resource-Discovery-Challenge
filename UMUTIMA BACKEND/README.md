# DD Rw Portal — Backend

Django REST Framework backend for the **Data Discovery Rwanda (DD Rw) Portal**, serving gender and socioeconomic indicator data sourced from NISR, MIGEPROF, and the 2022 Rwanda Population Census.

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Django | 6.0.3 |
| API | Django REST Framework | 3.16.1 |
| Language | Python | 3.10+ |
| Primary DB | SQLite (db.sqlite3) | — |
| Census DB | SQLite (data/census/rwanda_census.db) | — |
| Semantic Search | FAISS + sentence-transformers | faiss-cpu 1.9.0 / ST 3.0.1 |
| AI | Google Generative AI (Gemini) | 0.8.6 |
| CORS | django-cors-headers | 4.9.0 |

## Project Structure

```text
UMUTIMA BACKEND/
├── config/                     # Django project settings
│   ├── settings.py             # All configuration (env-driven)
│   ├── urls.py                 # Root URL conf (/api/, /api/census/, /admin/)
│   ├── wsgi.py
│   └── asgi.py
├── api/                        # Core application
│   ├── models.py               # 8 ORM models (see Models section)
│   ├── views.py                # All API views
│   ├── serializers.py          # DRF serializers
│   ├── urls.py                 # API URL patterns (13 routes)
│   ├── admin.py                # Admin registrations for all models
│   └── management/commands/
│       ├── seed_data.py        # Seed hardcoded sample data
│       ├── load_csv_data.py    # Import from data/ CSV files
│       └── build_search_index.py  # Build FAISS vector indices
├── census/                     # Census app (separate SQLite DB + router)
├── search/                     # FAISS search package
│   ├── indexer.py              # build_index() — writes .index files
│   ├── searcher.py             # search() + invalidate_cache()
│   ├── registry.py             # SOURCES dict
│   └── census_indexer.py       # build_census_index()
├── data/                       # Data files (populate before use)
│   ├── studies.csv             # Master study catalog (NISR/IHSN)
│   ├── study_resources.csv     # Downloadable resources per study_id
│   ├── quality_report.csv      # Quality flags per study_id
│   ├── census/
│   │   └── rwanda_census_2022.db
│   └── gap_actions.log         # NDJSON log of user gap submissions
├── indices/                    # FAISS index files (auto-generated)
├── manage.py
├── requirements.txt
├── .env.example                # Template — copy to .env.local
├── setup.bat                   # One-click Windows setup
└── run.bat                     # One-click Windows dev server start
```

## Django Apps

**`api`** — Core data app. Handles all indicator, catalog, search, and gap endpoints. Reads/writes `db.sqlite3`.

**`census`** — Serves Rwanda 2022 Population Census data from a dedicated SQLite database (`data/census/rwanda_census.db`). Uses `census.router.CensusRouter` so census models never touch the default database.

**`search`** — Plain Python package (not a Django app). Provides `build_index`, `search`, `invalidate_cache`, and `build_census_index`. Encodes text with `all-MiniLM-L6-v2` and stores flat L2 FAISS indices under `indices/`.

## Models

All defined in [api/models.py](api/models.py).

| Model | Purpose | Key Fields |
| --- | --- | --- |
| Metric | Dashboard summary card | id, domain, title, value, trend, trend_direction |
| ChartData | Mini sparkline data for a Metric | metric (1-to-1), data (JSON array) |
| Insight | AI-generated insight headline | id, insight_type, headline |
| GapAlert | Data gap notification | id, title, severity (critical/warning/info) |
| Study | Research study record | title, domain, organization, publication_date, status |
| StudyResource | File or link attached to a Study | study (FK), resource_type, file_format, url |
| QualityReport | Quality assessment for a Study | overall_score, overall_rating, disaggregation booleans |
| DetailedIndicator | Indicator with trend and regional data | id, domain, trend_data, disaggregation_*, regional_data |

`Study`, `StudyResource`, and `QualityReport` are joined on `study.id` / `study_id`.

## API Endpoints

Base path: `/api/`

| Method | Path | View | Description |
| --- | --- | --- | --- |
| GET | /api/ | APIRootView | Lists all endpoint URLs |
| GET | /api/health/ | HealthCheckView | Health check (returns status: ok) |
| GET | /api/indicators/ | IndicatorsListView | List all DetailedIndicator IDs + titles |
| GET | /api/indicators/metrics/ | MetricsView | Dashboard metrics with embedded chart data |
| GET | /api/indicators/{id}/detailed/ | DetailedIndicatorView | Full indicator with trend, disaggregation, regional data |
| GET | /api/insights/ | InsightsView | AI insight headlines |
| GET | /api/gaps/alerts/ | GapAlertsView | Data gap alert notifications |
| POST | /api/gap-actions/ | GapActionsView | Submit a gap action (logged to data/gap_actions.log) |
| GET | /api/catalog/ | CatalogStudiesView | CSV-backed study catalog (works before DB seed) |
| GET | /api/search/ | SemanticSearchView | FAISS semantic search across all sources |
| GET | /api/studies/ | StudyViewSet list | ORM-backed study list with filters |
| GET | /api/studies/{id}/ | StudyViewSet detail | Study with nested resources + quality report |
| GET | /api/studies/search/ | StudyViewSet.unified_search | Full-text ORM search across studies + resources |
| — | /api/census/... | Census app views | Census data endpoints |
| — | /admin/ | Django Admin | Model management |

### Catalog Query Parameters (GET /api/catalog/)

| Param | Description |
| --- | --- |
| q | Full-text search — all tokens must match |
| year | Filter by publication year |
| org | Filter by organization name (partial, case-insensitive) |
| id | Return single study by study_id (includes resources array) |
| stats=1 | Return aggregate statistics + data gap summary |
| coverage=1 | Return per-district study coverage counts (all 30 districts) |

### Semantic Search Parameters (GET /api/search/)

| Param | Default | Description |
| --- | --- | --- |
| q | required | Natural-language query |
| sources | all | Comma-separated: studies, metrics, indicators, insights, gap_alerts, census |
| top_k | 20 | Max results (capped at 50) |

### Study ViewSet Filters (GET /api/studies/)

| Param | Description |
| --- | --- |
| q | Keyword search across title, abstract, organization, keywords, resources |
| domain | One of: economic, health, education, leadership, crossCutting, finance |
| status | One of: active, completed, archived, ongoing |
| resource_type | Filter by attached resource type |
| quality_min | Minimum overall_score (0–100) |

## Quality Scoring Algorithm

Used by both `CatalogStudiesView` and `load_csv_data`. Baseline score of **100** with deductions per quality flag:

| Flag | Deduction |
| --- | --- |
| no_resources_found | -20 |
| missing_abstract | -15 |
| missing_units_of_analysis | -10 |
| missing_get_microdata_url | -8 |
| missing_data_access_type | -8 |
| missing_study_type | -5 |
| missing_scope_notes | -5 |
| generic_resource_type | -3 |

Ratings: excellent >= 85, good >= 70, fair >= 50, poor < 50.

## Management Commands

```bash
# Seed hardcoded sample data (metrics, insights, gap alerts, indicators)
python manage.py seed_data

# Import studies from CSV files in data/
python manage.py load_csv_data

# Import and replace all existing study data
python manage.py load_csv_data --clear

# Build FAISS indices for all sources
python manage.py build_search_index

# Build indices for specific sources only
python manage.py build_search_index --source studies metrics

# Build census index only (requires data/census/rwanda_census_2022.db)
python manage.py build_search_index --source census
```

`load_csv_data` reads three CSV files in order:

1. `data/quality_report.csv` — loads quality flags by study_id
2. `data/study_resources.csv` — loads downloadable resources by study_id
3. `data/studies.csv` — creates/updates Study, QualityReport, and StudyResource records

Domain is inferred from title + study_type keywords via `DOMAIN_MAP` in `load_csv_data.py`.

## Configuration

Copy `.env.example` to `.env.local`. Settings load via python-dotenv at startup (`load_dotenv('.env.local')`).

| Variable | Default | Description |
| --- | --- | --- |
| DEBUG | True | Django debug mode — set False in production |
| SECRET_KEY | insecure dev key | Must be changed in production |
| ALLOWED_HOSTS | localhost,127.0.0.1 | Comma-separated allowed host names |
| GEMINI_API_KEY | (empty) | Google Gemini API key for AI features |
| CORS_ALLOWED_ORIGINS | http://localhost:3000 | Use http://localhost:5173 for the Vite frontend |
| DATABASE_URL | sqlite:///db.sqlite3 | Reference only — not currently consumed by settings |

## Data Pipeline

```text
NISR / IHSN CSV export
        |
        v
  data/studies.csv  +  data/study_resources.csv  +  data/quality_report.csv
        |                     (joined on study_id at import time)
        v
  python manage.py load_csv_data
        |
        v
  Study + StudyResource + QualityReport  (db.sqlite3)
        |
        v
  python manage.py build_search_index
        |
        v
  indices/studies.index  (FAISS flat L2, all-MiniLM-L6-v2 embeddings)
```

`CatalogStudiesView` at `/api/catalog/` performs the same three-file join at request time directly from CSV, so it works before any `load_csv_data` run.

## Gap Action Submissions

`POST /api/gap-actions/` accepts:

```json
{
  "action_type": "submit | correct | request",
  "gap_title": "string",
  "affected_study_id": "optional",
  "affected_study_title": "optional",
  "message": "string",
  "email": "string",
  "name": "string"
}
```

Required fields: `action_type`, `gap_title`, `message`, `email`, `name`. Submissions are appended as NDJSON to `data/gap_actions.log`.

## Quick Start

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for full instructions, or run `setup.bat` on Windows.

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env.local
python manage.py migrate
python manage.py seed_data
python manage.py load_csv_data
python manage.py build_search_index
python manage.py runserver
```

Server starts at <http://localhost:8000>. Admin panel at <http://localhost:8000/admin>.
