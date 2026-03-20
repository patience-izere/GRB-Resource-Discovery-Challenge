# Gender Data Resource Hub (GDRH) 2026

## Team Izere-Fabrice Gender Data Resource Hub (GDRH) 2026

**Built by:** Izere Marie Vincent Patience & Fabrice Hakuzimana
**Event:** Gender Data Hackathon 2026
**Data Sources:** NISR (National Institute of Statistics of Rwanda), MIGEPROF (Ministry of Gender and Family Promotion)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Persona & Pain Points](#2-user-persona--pain-points)
3. [Platform Architecture & Data Logic](#3-platform-architecture--data-logic)
4. [Setup & Installation](#4-setup--installation)
5. [Key Workflows: Discovery, Evaluation & Utilization](#5-key-workflows-discovery-evaluation--utilization)
6. [Policy & Advocacy Scenario](#6-policy--advocacy-scenario)
7. [Data Usage & Provenance](#7-data-usage--provenance)
8. [API Reference](#8-api-reference)
9. [Limitations & Next Steps](#9-limitations--next-steps)
10. [Judging Rubric Alignment](#10-judging-rubric-alignment)

---

## 1. Project Overview

### What Is the GDRH?

The **Gender Data Resource Hub (GDRH)** is an open-access web platform that centralises, validates, and surfaces Rwanda's gender-disaggregated statistical resources for Civil Society Organisations (CSOs), policy analysts, researchers, and government planners.

Rwanda produces a rich body of gender-relevant data — Demographic Health Surveys, Labour Force Surveys, EICV household surveys, Agricultural Household Surveys, and Population Censuses — yet this data remains scattered across institutional portals, locked in PDF downloads, and difficult to cross-reference. **The GDRH solves this by creating a single, searchable, quality-scored interface over the NISR microdata catalog and MIGEPROF policy data.**

### How It Improves Visibility and Usability for CSOs

| Before GDRH | After GDRH |
|---|---|
| Analysts manually browse NISR's catalog page-by-page | Full-text + semantic search across 70+ validated studies |
| Quality of metadata is unknown | Each study carries an automated quality score (0-100) with named flags |
| Resources are buried in PDF archives | All attachments (questionnaires, reports, datasets) are linked and typed |
| No geographic lens | District-level coverage heatmap shows data density across Rwanda's 30 districts |
| Data gaps are invisible | Automated gap alerts flag studies with missing resources or broken metadata |
| No advocacy pathway | One-click "Generate Advocacy Brief" action on every gap alert |

### Core Tooling

| Layer | Technology |
|---|---|
| **Data Processing** | Python 3.10+, Pandas, CSV |
| **Backend API** | Django 6.0, Django REST Framework 3.16 |
| **Semantic Search** | FAISS (faiss-cpu), sentence-transformers |
| **AI Integration** | Google Gemini API (google-generativeai) |
| **Frontend** | React 18, TypeScript, Vite, Lucide React |
| **Database** | SQLite (development) / PostgreSQL-compatible |
| **ML / Embeddings** | scikit-learn, numpy, torch, transformers |

---

## 2. User Persona & Pain Points

### Persona: Claudine N., Policy Analyst — MIGEPROF Gender Statistics Unit

**Background:** Claudine is a mid-career policy analyst at the Ministry of Gender and Family Promotion. She holds a Master's degree in Development Studies and is responsible for producing the annual Gender Statistics Report submitted to Parliament. She is comfortable with Excel but does not code.

**Her weekly data workflow (before GDRH):**

1. Opens the NISR microdata portal — searches manually by keyword.
2. Clicks through 8–12 catalog pages to find the right DHS or EICV edition.
3. Downloads a 4 MB PDF questionnaire just to confirm whether the survey collected sex-disaggregated employment data.
4. Discovers the report she needed was from 2019 and a 2021 update exists — but she only finds this by accident.
5. Copies URLs into a personal spreadsheet to track what she has reviewed.
6. Spends 3–4 hours per report cycle just navigating and cataloguing sources before analysis even begins.

**Her core pain points:**

- **PDF-heavy discovery:** Critical metadata (scope, methodology, disaggregation) is buried inside multi-hundred-page PDFs, not surfaced at the catalog level.
- **No quality signal:** She cannot tell at a glance whether a study has complete metadata, accessible microdata, or sex-disaggregated indicators.
- **Broken or missing links:** Several NISR catalog entries have no downloadable resources attached, wasting lookup time.
- **No cross-study comparison:** She cannot easily compare the 2014 DHS to the 2019 DHS without opening both PDFs side by side.
- **No advocacy bridge:** Even when she identifies a data gap, there is no institutional pathway to formally flag it to NISR for resolution.

**How GDRH addresses Claudine directly:**

- Full-text search returns relevant studies in under 2 seconds.
- Each study card displays quality score, resource count, and disaggregation flags upfront — no PDF download required.
- Gap alerts surface broken entries automatically, with a one-click submission form to request a correction from NISR.
- The geographic coverage map shows instantly which districts are data-poor, informing where Claudine should advocate for new data collection.

---

## 3. Platform Architecture & Data Logic

### Repository Structure

```
UMUTIMA/
├── UMUTIMA BACKEND/          # Django REST API
│   ├── api/
│   │   ├── models.py         # Study, StudyResource, QualityReport, Metric, GapAlert
│   │   ├── views.py          # CatalogStudiesView, SemanticSearchView, GapActionsView
│   │   ├── serializers.py    # DRF serializers
│   │   ├── urls.py           # API routing
│   │   └── management/
│   │       └── commands/
│   │           ├── load_csv_data.py    # CSV import pipeline
│   │           ├── seed_data.py        # Seed demo metrics & indicators
│   │           └── build_search_index.py # FAISS index builder
│   ├── data/
│   │   ├── studies.csv           # Master study catalog (NISR)
│   │   ├── study_resources.csv   # Per-study downloadable resources
│   │   └── quality_report.csv    # Automated quality flags per study
│   ├── config/               # Django settings
│   └── requirements.txt
└── UMUTIMA/                  # React/TypeScript frontend
    ├── src/
    │   ├── components/
    │   │   └── GapAlert.tsx  # Gap alert card with advocacy action
    │   └── lib/
    │       └── export.ts     # CSV export utility
    └── index.html
```

### The Three-Table Join: Core Data Architecture

The platform's catalog is powered by three CSV files that are joined on `study_id` at both import time (into Django ORM) and at runtime (via `CatalogStudiesView`).

```
studies.csv                study_resources.csv         quality_report.csv
───────────────────        ────────────────────        ──────────────────────
study_id  (PK)  ◄──────── study_id  (FK)              study_id  (FK) ◄────────
title                      type                        quality_flags
abstract                   name                        missing_field_count
organization               label                       resource_count
year                       url                         resource_quality_flags
geographic_coverage        filename
kind_of_data
catalog_page
get_microdata_url
data_access_type
```

**At runtime**, the `CatalogStudiesView` performs this join in pure Python/Pandas-style logic:

```python
# Pseudocode reflecting views.py CatalogStudiesView logic
resources_map  = {row['study_id']: [...] for row in study_resources.csv}
quality_map    = {row['study_id']: {...} for row in quality_report.csv}

for row in studies.csv:
    study = {
        **row,
        'resources':      resources_map.get(row['study_id'], []),
        'quality_score':  compute_score(quality_map[row['study_id']]['quality_flags']),
        'quality_rating': compute_rating(score),
    }
```

**At import time**, `load_csv_data.py` materialises this join into Django ORM objects (`Study`, `StudyResource`, `QualityReport`) for persistent storage and full ORM querying.

### Quality Scoring Algorithm

Every study in the catalog carries an automated quality score derived from the `quality_flags` column in `quality_report.csv`. The scoring algorithm applies weighted deductions from a baseline of 100:

```python
DEDUCTIONS = {
    'missing_study_type':          -5,
    'missing_scope_notes':         -5,
    'missing_abstract':           -15,   # high impact — breaks discoverability
    'missing_units_of_analysis':  -10,
    'missing_get_microdata_url':   -8,
    'missing_data_access_type':    -8,
    'no_resources_found':         -20,   # critical — study is effectively inaccessible
    'generic_resource_type':       -3,
}

score = 100.0 - sum(DEDUCTIONS[flag] for flag in flags)
rating = (
    'excellent' if score >= 85 else
    'good'      if score >= 70 else
    'fair'      if score >= 50 else
    'poor'
)
```

**Example:** A study with `missing_study_type;missing_scope_notes` flags receives a score of **90.0 (Good)**, while a study with `no_resources_found` drops to **80.0** before any other deductions.

### NISR Link Validation

All resource URLs in `study_resources.csv` follow the pattern:

```
https://microdata.statistics.gov.rw/index.php/catalog/{study_id}/download/{resource_id}
```

The `quality_report.csv` flags entries where no URLs exist (`no_resources_found`) or where catalog metadata is incomplete (`missing_get_microdata_url`). These flags are surfaced as **Gap Alerts** in the frontend with severity levels: `critical`, `warning`, or `info`.

### Semantic Search Engine

Beyond keyword search, the platform supports **vector-similarity search** powered by FAISS:

- All study titles, abstracts, and resource descriptions are embedded using `sentence-transformers`
- Embeddings are stored in a FAISS index built via `python manage.py build_search_index`
- At query time, the user's query is embedded and compared against the index using cosine similarity
- Results are ranked by semantic relevance and returned alongside keyword matches

### Domain Classification

Studies are automatically classified into five policy domains using keyword inference on the study title and `study_type` field:

| Domain | Keyword Triggers |
|---|---|
| `economic` | agricultural, labour force, employment, finscope, financial, enterprise |
| `health` | demographic, dhs, food security, nutrition, service provision |
| `education` | education, literacy |
| `crossCutting` | population, census, household living, eicv, child labour, vision 2020 |
| `leadership` | (assigned via manual seed data for leadership indicators) |

---

## 4. Setup & Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- pip
- Git

### Backend Setup (Django REST API)

```bash
# 1. Clone the repository
git clone <repository-url>
cd "UMUTIMA BACKEND"

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Configure environment variables
cp .env.example .env.local
# Edit .env.local and set your GEMINI_API_KEY:
# GEMINI_API_KEY=your_gemini_api_key_here

# 6. Run database migrations
python manage.py migrate

# 7. Import NISR study data from CSV files
python manage.py load_csv_data

# 8. (Optional) Seed demo metrics and indicators
python manage.py seed_data

# 9. (Optional) Build the FAISS semantic search index
python manage.py build_search_index

# 10. Start the development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

### Frontend Setup (React)

```bash
# From the UMUTIMA/ directory
cd UMUTIMA

# Install Node dependencies
npm install

# Set the Gemini API key
# Create .env.local and add:
# VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Django Admin Panel

```bash
# Create a superuser to access the admin panel
python manage.py createsuperuser

# Visit: http://localhost:8000/admin
```

### Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `DEBUG` | Django debug mode (`True`/`False`) | Yes |
| `SECRET_KEY` | Django secret key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | Yes |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins for frontend | Yes |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |

---

## 5. Key Workflows: Discovery, Evaluation & Utilization

The platform is designed around three sequential phases that mirror a CSO analyst's real-world research process.

### Phase 1: Discovery

**Goal:** Find relevant gender data studies quickly without manual portal navigation.

**How it works:**

1. The analyst enters a search term (e.g., "women employment 2020") into the search bar.
2. The backend's `CatalogStudiesView` performs multi-token keyword matching across `title`, `abstract`, `organization`, `study_type`, `geographic_scope`, and `scope_notes` fields.
3. Simultaneously, `SemanticSearchView` runs a FAISS vector search over embedded study text, catching synonyms and related concepts (e.g., "female labour participation" matching "women's work").
4. Results are ranked and returned with: title, year, organization, resource count, and quality score visible on each card.
5. The geographic coverage map (powered by the `?coverage=1` API mode) highlights districts mentioned in study text, giving an instant spatial overview.

**Supported query parameters:**

| Parameter | Example | Effect |
|---|---|---|
| `q` | `q=labour+force` | Full-text keyword search |
| `year` | `year=2020` | Filter by publication year |
| `org` | `org=NISR` | Filter by organisation name |
| `id` | `id=68` | Fetch single study detail |
| `coverage` | `coverage=1` | Return district-level coverage map |
| `stats` | `stats=1` | Return catalog statistics and gap summary |

### Phase 2: Evaluation

**Goal:** Assess whether a study's data is fit for purpose before investing time in downloading it.

**How it works:**

1. Clicking a study card expands its detail view, showing:
   - **Quality Score** (0-100) and **Rating** (Excellent / Good / Fair / Poor)
   - **Quality Flags** — named deficiencies (e.g., `missing_study_type`, `no_resources_found`)
   - **Resource List** — all attached files with type (PDF, XLS), name, and direct download URL
   - **Disaggregation Indicators** — whether the study is sex-disaggregated, age-disaggregated, or geographically disaggregated
2. Studies with `no_resources_found` are visually flagged with a `critical` gap alert.
3. The quality scoring algorithm (see Section 3) ensures analysts can compare two studies numerically — for example, the 2014-2015 DHS (score: 90, excellent) vs. the 2022 Population Census (score: 80, good).

**Gap Alert Severity Levels:**

| Severity | Trigger | Example |
|---|---|---|
| `critical` | `no_resources_found` | Enterprise Survey 2006 — no downloadable files |
| `warning` | `missing_abstract` | Recensement 1978 — no study description |
| `info` | `missing_study_type` + `missing_scope_notes` | EICV7 2023-2024 — incomplete metadata |

### Phase 3: Utilization

**Goal:** Act on discovered data — export it, flag gaps, or build an advocacy case.

**How it works:**

1. **Export:** Any search result set can be exported to CSV using the built-in `exportToCSV()` utility, producing a timestamped file (`studies_2026-03-20.csv`) for offline analysis.
2. **Gap Action Submission:** On any gap alert, the analyst can:
   - **Submit Data** — attach new or updated resource links
   - **Request Update** — formally ask NISR to update a study's metadata
   - **Correct Info** — flag a factual error for review
   All submissions are logged via the `POST /api/gap-actions/` endpoint and timestamped for audit trail.
3. **Generate Advocacy Brief:** The "Generate Advocacy Brief" button on each gap alert (powered by Gemini AI) produces a structured brief citing the specific data gap, affected studies, and a recommended action for the responsible institution.
4. **Statistics Dashboard:** The `?stats=1` mode returns a catalog-wide summary including: total studies, total resources, studies by type, studies by year, average quality score, and data gaps — ready for inclusion in annual gender statistics reports.

---

## 6. Policy & Advocacy Scenario

### Scenario: Advocating for Sex-Disaggregated Labour Force Data in the Northern Province

**Actors:** Claudine N. (MIGEPROF Policy Analyst), NISR Labour Force Survey Team
**Date:** March 2026
**Objective:** Claudine needs to produce a brief for the Parliamentary Committee on Gender showing the employment gender gap in Rwanda's Northern Province between 2019 and 2024.

---

**Step 1 — Discovery**

Claudine opens the GDRH and searches: `labour force northern province`.

The platform returns six studies in under 2 seconds:
- Rwanda Labour Force Survey (2019) — Quality: 90 (Excellent), 4 resources
- Rwanda Labour Force Survey 2020 — Quality: 80 (Good), 3 resources
- Rwanda Labour Force Survey 2021 — Quality: 80 (Good), 3 resources
- Rwanda Labour Force Survey 2022 — Quality: 80 (Good), 3 resources
- Rwanda Labour Force Survey 2023 — Quality: 80 (Good), 1 resource
- Rwanda Labour Force Survey 2024 — Quality: 80 (Good), 1 resource

*Source: NISR, Rwanda Labour Force Surveys 2019-2024, microdata.statistics.gov.rw.*

---

**Step 2 — Evaluation**

Claudine clicks on the 2023 survey. The quality flags show:
- `missing_study_type` — the catalog entry does not specify whether this is a panel or cross-sectional survey
- `missing_scope_notes` — no geographic breakdown is documented at the catalog level

The quality score is **80 (Good)** — usable but incomplete. The single attached resource is a summary report PDF. Claudine notices: **there is no microdata download URL** — meaning she cannot run her own disaggregation by province.

*Source: NISR, Rwanda Labour Force Survey 2023, microdata.statistics.gov.rw, catalog entry 110.*

---

**Step 3 — Gap Identification**

The platform's `stats` mode surfaces an automated gap alert:

> **"4 Studies with Metadata Gaps"** (severity: `info`)
> Studies missing study type, scope notes, or access type fields — including all Labour Force Surveys from 2021 onward.

A second gap alert reads:

> **"Missing Microdata Access — Labour Force 2023 & 2024"** (severity: `warning`)
> Two of the most recent Labour Force Surveys have no `get_microdata_url`, preventing independent analysis of sex-disaggregated employment data at the district level.

---

**Step 4 — Advocacy Action**

Claudine clicks **"Generate Advocacy Brief"** on the microdata access gap alert. The Gemini-powered brief is generated in seconds:

> **Draft Advocacy Brief — Gender Data Access Gap: Rwanda Labour Force Surveys 2023-2024**
>
> *Prepared by: MIGEPROF Gender Statistics Unit | March 2026*
>
> **Issue:** The NISR microdata portal does not currently provide downloadable microdata for the Rwanda Labour Force Surveys 2023 and 2024 (catalog IDs 110 and 114). This prevents civil society organisations and ministry analysts from conducting independent sex-disaggregated employment analysis at the provincial and district level — a key input for Rwanda's Gender Monitoring and Evaluation Framework.
>
> **Recommendation:** NISR should publish anonymised microdata files for LFS 2023 and LFS 2024 under an open data license on the microdata portal within 60 days, consistent with Rwanda's National Data Sharing Policy and SDG Indicator 5.b.1.
>
> **Supporting Citation:** Source: NISR, Rwanda Labour Force Survey 2023, microdata.statistics.gov.rw, catalog ID 110, accessed March 2026 (resource status: summary PDF only, no microdata).

Claudine exports the two affected study records to CSV and attaches them as evidence to a formal data access request submitted through the platform's `POST /api/gap-actions/` endpoint, specifying `action_type: request` and recipient institution: NISR.

---

**Outcome:** Within the same 30-minute session, Claudine has: (1) identified six relevant studies, (2) assessed their quality without opening a single PDF, (3) surfaced a critical microdata access gap, (4) generated a draft advocacy brief with proper citations, and (5) submitted a formal institutional data request — all from a single interface.

**This is the core value proposition of the GDRH**: compressing a 4-hour manual research-and-advocacy cycle into under an hour, with full citation trails and institutional accountability pathways built in.

---

## 7. Data Usage & Provenance

The following table documents key NISR resources validated during the hackathon. All URLs were checked against `https://microdata.statistics.gov.rw` as of March 2026.

| Source Institution | Study Title | Year | Access URL | Access Status | Access Timestamp |
|---|---|---|---|---|---|
| NISR | Demographic and Health Survey | 2000 | https://microdata.statistics.gov.rw/index.php/catalog/11 | Available | 2026-03-20 |
| NISR | Demographic Health Survey | 2005 | https://microdata.statistics.gov.rw/index.php/catalog/14 | Available | 2026-03-20 |
| NISR | Demographic and Health Survey 2014-2015 | 2015 | https://microdata.statistics.gov.rw/index.php/catalog/68 | Available | 2026-03-20 |
| NISR | Rwanda Demographic and Health Survey 2019-2020 | 2020 | https://microdata.statistics.gov.rw/index.php/catalog/98 | Available | 2026-03-20 |
| NISR | Integrated Household Living Conditions Survey (EICV4) 2013-2014 | 2014 | https://microdata.statistics.gov.rw/index.php/catalog/75 | Available | 2026-03-20 |
| NISR | Integrated Household Living Conditions Survey (EICV5) 2016-2017 | 2017 | https://microdata.statistics.gov.rw/index.php/catalog/82 | Available | 2026-03-20 |
| NISR | Integrated Household Living Conditions Survey (EICV7) 2023-2024 | 2024 | https://microdata.statistics.gov.rw/index.php/catalog/119 | Available | 2026-03-20 |
| NISR | Rwanda Population and Housing Census 2012 | 2012 | https://microdata.statistics.gov.rw/index.php/catalog/65 | Available | 2026-03-20 |
| NISR | Rwanda Population and Housing Census 2022 | 2022 | https://microdata.statistics.gov.rw/index.php/catalog/109 | Available | 2026-03-20 |
| NISR | Rwanda Labour Force Survey 2019 | 2019 | https://microdata.statistics.gov.rw/index.php/catalog/92 | Available | 2026-03-20 |
| NISR | Rwanda Labour Force Survey 2023 | 2023 | https://microdata.statistics.gov.rw/index.php/catalog/110 | Available (PDF only, no microdata) | 2026-03-20 |
| NISR | Rwanda Labour Force Survey 2024 | 2024 | https://microdata.statistics.gov.rw/index.php/catalog/114 | Available (PDF only, no microdata) | 2026-03-20 |
| NISR | Agricultural Household Survey 2017 | 2017 | https://microdata.statistics.gov.rw/index.php/catalog/90 | Available | 2026-03-20 |
| NISR | Rwanda Season Agriculture Survey 2023 | 2023 | https://microdata.statistics.gov.rw/index.php/catalog/111 | Available | 2026-03-20 |
| NISR | FinScope 2024, Financial Inclusion in Rwanda | 2024 | https://microdata.statistics.gov.rw/index.php/catalog/120 | Available | 2026-03-20 |
| NISR | Enterprise Survey 2006 | 2006 | https://microdata.statistics.gov.rw/index.php/catalog/40 | **Broken** (no resources attached) | 2026-03-20 |
| NISR | Micro-Enterprise Survey 2006 | 2006 | https://microdata.statistics.gov.rw/index.php/catalog/43 | **Broken** (no resources attached) | 2026-03-20 |
| NISR | Recensement General de la Population 1978 | 1978 | https://microdata.statistics.gov.rw/index.php/catalog/46 | Partial (missing abstract, no microdata URL) | 2026-03-20 |
| NISR | Comprehensive Food Security and Vulnerability Analysis 2024 | 2024 | https://microdata.statistics.gov.rw/index.php/catalog/122 | Available | 2026-03-20 |
| NISR | Rwanda National Child Labour Survey 2008 | 2008 | https://microdata.statistics.gov.rw/index.php/catalog/21 | Available | 2026-03-20 |

**Citation format used throughout this project:**
> Source: `{Institution}`, `{Study Title}`, `{Year}`, `{Access URL}`.

**Total studies in catalog:** 74
**Total resources indexed:** 300+
**Studies with confirmed broken/no resources:** 4 (Enterprise Survey 2006, Micro-Enterprise Survey 2011, Micro-Enterprise Survey 2006, Enterprise Survey 2011)

---

## 8. API Reference

The backend exposes a RESTful API at `http://localhost:8000/api/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/` | API root — lists all available endpoints |
| `GET` | `/api/health/` | Health check — confirms API is running |
| `GET` | `/api/catalog/` | Study catalog from CSV (fast, no DB required) |
| `GET` | `/api/catalog/?stats=1` | Catalog statistics and gap summary |
| `GET` | `/api/catalog/?coverage=1` | District-level geographic coverage map |
| `GET` | `/api/catalog/?q={term}` | Full-text keyword search |
| `GET` | `/api/catalog/?id={study_id}` | Single study detail with resources |
| `GET` | `/api/search/?q={term}` | Semantic (FAISS vector) search |
| `GET` | `/api/studies/` | ORM-backed study list (requires seeded DB) |
| `GET` | `/api/studies/{id}/` | ORM-backed study detail |
| `GET` | `/api/indicators/metrics/` | Gender dashboard metrics |
| `GET` | `/api/insights/` | AI-generated insights |
| `GET` | `/api/gaps/alerts/` | Active data gap alerts |
| `POST` | `/api/gap-actions/` | Submit a gap action (data, correction, request) |
| `GET` | `/api/indicators/` | List all detailed indicators |
| `GET` | `/api/indicators/{id}/detailed/` | Single detailed indicator with trend data |

### Gap Action Submission Payload

```json
POST /api/gap-actions/
{
  "action_type": "request",
  "gap_title": "Missing Microdata — Labour Force Survey 2023",
  "affected_study_id": "110",
  "affected_study_title": "Rwanda Labour Force Survey 2023",
  "message": "Please publish anonymised microdata to enable provincial-level gender analysis.",
  "email": "analyst@migeprof.gov.rw",
  "name": "Claudine N."
}
```

---

## 9. Limitations & Next Steps

### Current Technical Boundaries

| Limitation | Details |
|---|---|
| **No live NISR API** | The platform reads from static CSV snapshots. Changes to the NISR catalog are not reflected until the CSV files are manually updated and `load_csv_data` is re-run. |
| **No real-time link validation** | Broken URLs are detected via quality flags in the CSV, not by live HTTP HEAD checks. A resource marked "Available" may have become unavailable since the last export. |
| **Keyword domain classification only** | Study domain (economic, health, etc.) is inferred from title keywords — misclassifications are possible for studies with ambiguous titles. |
| **FAISS index is static** | The semantic search index must be rebuilt manually (`build_search_index`) after new studies are imported. There is no automatic re-indexing on import. |
| **No user authentication on gap submissions** | The `POST /api/gap-actions/` endpoint accepts unauthenticated submissions. Submissions are logged to a flat file, not sent directly to NISR. |
| **Single-language metadata** | Study titles and abstracts are in English or French; no Kinyarwanda tokenisation is applied in the current search pipeline. |
| **SQLite in development** | The default database is SQLite, which is unsuitable for concurrent production use. A PostgreSQL deployment is required for multi-user access. |

### Recommended Next Steps

**Short-term (1-3 months):**
- [ ] Implement scheduled HTTP HEAD checks on all resource URLs and update quality flags automatically
- [ ] Add PostgreSQL configuration for production deployment
- [ ] Build a NISR catalog scraper to keep CSV data fresh without manual exports
- [ ] Add Kinyarwanda tokenisation support to the search pipeline

**Medium-term (3-6 months):**
- [ ] **AI-powered metadata enrichment:** Use Gemini to auto-extract sex-disaggregation indicators, sample size, and methodology from PDF content
- [ ] **Automated report generation:** Generate structured gender gap reports on-demand from dashboard data, ready for parliamentary submission
- [ ] **MIGEPROF data integration:** Ingest MIGEPROF's Gender Monitoring Framework indicators directly via API
- [ ] **User accounts and saved searches:** Allow CSO analysts to create accounts, save search queries, and receive alerts when new matching studies are published

**Long-term (6-12 months):**
- [ ] **Federated search:** Extend beyond NISR to include World Bank, UN Women Rwanda, and UNFPA data portals via their respective APIs
- [ ] **Predictive gap detection:** Use ML to predict which indicator domains are likely to have data gaps in the next survey cycle based on historical patterns
- [ ] **Natural language query interface:** Allow analysts to ask questions in plain English (e.g., "Show me female employment trends in Kigali 2015-2024") backed by Gemini's function-calling capabilities

---

## 10. Judging Rubric Alignment

### Trustworthiness

All data presented in this platform originates from primary institutional sources. Citations follow the format:

> Source: `{Institution}`, `{Study Title}`, `{Year}`, `{Access URL}`.

**Examples from this project:**
- Source: NISR, Demographic and Health Survey 2014-2015, 2015, https://microdata.statistics.gov.rw/index.php/catalog/68.
- Source: NISR, Rwanda Population and Housing Census 2022, 2022, https://microdata.statistics.gov.rw/index.php/catalog/109.
- Source: NISR, Integrated Household Living Conditions Survey (EICV7) 2023-2024, 2024, https://microdata.statistics.gov.rw/index.php/catalog/119.

The quality scoring algorithm is fully transparent and open-source. Every deduction is named, weighted, and documented (see Section 3). No black-box scoring is applied.

### Maintainability

The platform is designed for long-term maintainability:

- **Clean separation of concerns:** Data layer (CSV), API layer (Django), and presentation layer (React) are independently deployable.
- **Management commands** (`load_csv_data`, `seed_data`, `build_search_index`) make data updates reproducible and scriptable.
- **Quality flags** are schema-defined strings — adding a new flag type requires only a one-line addition to the `DEDUCTIONS` dictionary and a CSV update.
- **The `CatalogStudiesView` CSV mode** ensures the platform works even without a seeded database, reducing operational dependency.
- All dependencies are pinned in `requirements.txt` for reproducible environments.

### Policy Relevance

The advocacy scenario in Section 6 is the centrepiece of this submission. It demonstrates a complete, end-to-end policy workflow:

1. **Concrete actor** (MIGEPROF analyst) with a **real institutional mandate** (Parliamentary Gender Report)
2. **Specific data gap** (missing microdata for LFS 2023-2024) affecting **a concrete policy question** (provincial employment gender gap)
3. **Measurable time saving** (4-hour manual process reduced to under 1 hour)
4. **Institutional accountability pathway** (gap action submission with audit log)
5. **AI-generated advocacy output** (structured brief with citations ready for submission)

This demonstrates that the GDRH is not a data visualisation exercise — it is an **active policy infrastructure tool** that creates a feedback loop between data users (CSOs, ministries) and data producers (NISR, MIGEPROF).

---

## Contributing

This project was built during the **Gender Data Hackathon 2026**. For contributions, corrections, or institutional partnerships, please open an issue or contact the team.

**Izere Marie Vincent Patience** — Data Architecture & Backend API
**Fabrice Hakuzimana** — Frontend Development & Policy Analysis

---

*All data used in this platform is sourced from publicly accessible institutional repositories. No personally identifiable information is stored or processed. Gender data is used strictly for policy research and advocacy purposes consistent with Rwanda's National Gender Policy.*
