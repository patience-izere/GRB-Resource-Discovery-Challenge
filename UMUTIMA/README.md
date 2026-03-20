# DD Rw Portal — Frontend

**Data Discovery Rwanda (DD Rw) Portal** — React/TypeScript single-page application for exploring, analyzing, and contributing Rwanda gender and census data.

**Built by:** Izere Marie Vincent Patience & Fabrice Hakuzimana
**Hackathon:** Gender Data Hackathon 2026
**Backend repo:** `../UMUTIMA BACKEND/` (Django REST API)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Getting Started](#3-getting-started)
4. [Environment Variables](#4-environment-variables)
5. [Pages & Routing](#5-pages--routing)
6. [Component Inventory](#6-component-inventory)
7. [API Layer](#7-api-layer)
8. [State Management](#8-state-management)
9. [Design System](#9-design-system)
10. [Data Export](#10-data-export)
11. [AI Integration](#11-ai-integration)
12. [Adding New Pages or Components](#12-adding-new-pages-or-components)
13. [Backend Dependency](#13-backend-dependency)

---

## 1. Tech Stack

| Concern | Library / Tool | Version |
| --- | --- | --- |
| Framework | React | 18 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS + custom tokens | 3.x |
| Server-state | @tanstack/react-query | 5.x |
| Charts | Recharts | 2.x |
| Icons | Lucide React | latest |
| AI | @google/genai (Gemini 2.0 Flash) | latest |
| PDF export | html2canvas + jsPDF | latest |
| Map | Custom SVG (RwandaMap component) | — |
| Linting | ESLint + TypeScript ESLint | — |

The app has **no React Router**. Navigation is handled by a `Page` type union and a `switch` statement in `App.tsx`. This keeps the bundle small and avoids URL-based state complexity.

---

## 2. Project Structure

```text
UMUTIMA/              <- this directory
├── src/
│   ├── App.tsx                     # Root component. Owns page state, layout shell, QueryClientProvider, DistrictProvider
│   ├── main.tsx                    # Vite entry point — mounts <App /> into #root
│   ├── index.css                   # Tailwind directives + custom utility classes (btn-primary, skeleton, etc.)
│   │
│   ├── pages/                      # One file per top-level page
│   │   ├── CensusPage.tsx          # Population / Census overview (default landing page)
│   │   ├── Dashboard.tsx           # Data Observatory — catalog stats, charts, map, gap alerts
│   │   ├── DataExplorerPage.tsx    # Study search and browse
│   │   ├── GapAnalysis.tsx         # Data gap visualization and CTA actions
│   │   ├── DistrictMap.tsx         # Full-screen district coverage map
│   │   ├── Reports.tsx             # Data Contribution form (6-section structured submission)
│   │   └── Settings.tsx            # About Us / project info
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Sidebar.tsx             # Collapsible nav with mobile drawer
│   │   ├── Header.tsx              # Top bar — hamburger + info button
│   │   ├── RwandaMap.tsx           # SVG map of Rwanda's 30 districts
│   │   ├── DataExplorer.tsx        # Study card list + filter bar (used by DataExplorerPage)
│   │   ├── MetricCard.tsx          # KPI stat card with sparkline
│   │   ├── GapAlert.tsx            # Gap alert card with severity border
│   │   ├── GapCtaModal.tsx         # Modal: Submit / Correct / Request Update actions
│   │   ├── PdfExportModal.tsx      # Section-select modal before PDF generation
│   │   ├── DistrictFilter.tsx      # Multi-select district filter dropdown
│   │   ├── WelcomeConsent.tsx      # First-visit consent modal (localStorage-persisted)
│   │   └── search/
│   │       ├── SemanticSearchBar.tsx  # Debounced input -> /api/search/ (FAISS vector search)
│   │       └── SearchResultItem.tsx   # Individual search result card
│   │   └── census/
│   │       ├── OverviewCards.tsx      # Population KPI cards (total, density, fertility, etc.)
│   │       ├── RegionalChart.tsx      # Province / district population bar chart
│   │       ├── SectorPanel.tsx        # Sector-specific data table (Education / Health / Agriculture)
│   │       ├── ProjectionChart.tsx    # Population projection line chart (2022-2050)
│   │       ├── DeviationsTable.tsx    # District deviations from national averages
│   │       └── VulnerabilityScorecard.tsx  # Composite vulnerability ranking by district
│   │
│   ├── context/
│   │   └── DistrictContext.tsx     # Global district selection state (30 districts, React Context)
│   │
│   ├── hooks/
│   │   └── useDebounce.ts          # Generic debounce hook (used by SemanticSearchBar)
│   │
│   └── lib/
│       ├── api.ts                  # All fetch calls + TypeScript interfaces + static fallback data
│       ├── export.ts               # CSV export (Blob download)
│       ├── pdfExport.ts            # PDF export (html2canvas -> jsPDF, A4 portrait, 2x scale)
│       └── designTokens.ts         # Domain color map (economic, health, education, leadership, etc.)
│
├── index.html                      # Vite HTML entry point
├── .env.example                    # Environment variable template
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 3. Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- The Django backend running at `http://localhost:8000` (see `../UMUTIMA BACKEND/README.md`)

### Install and run

```bash
# From this directory (UMUTIMA/)
npm install

# Copy the environment template and fill in your API key
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local (required for AI Insights feature)

# Start the development server
npm run dev
```

The app starts at `http://localhost:5173` by default.

### Other npm scripts

```bash
npm run build       # Production build -> dist/
npm run preview     # Preview the production build locally
npm run lint        # Run ESLint across src/
```

### First run checklist

1. Backend is running: `curl http://localhost:8000/api/health/` returns `{"status": "ok"}`
2. CSV data is imported: `python manage.py load_csv_data` was run in the backend
3. `.env.local` has `GEMINI_API_KEY` set (without this, the AI Insights button is disabled)
4. Browser opens `http://localhost:5173` — the Census Overview page loads by default

---

## 4. Environment Variables

Create `.env.local` in this directory (gitignored). Vite only exposes variables prefixed with `VITE_` to the client bundle.

| Variable | Default if unset | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | Base URL for the Django REST backend. Change this for staging/production. |
| `GEMINI_API_KEY` | — | Google Gemini API key. Used by the Dashboard AI Insights feature and Gap Analysis AI brief generator. Without it, those buttons are disabled. |

**How `VITE_API_URL` is consumed in code:**

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Census endpoints use the same base:
const CENSUS_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/census`;
```

**Production deployment:** Set `VITE_API_URL=https://your-backend-domain.com/api` at build time. The built `dist/` directory is a static bundle — serve it with any web server (Nginx, Vercel, Netlify, etc.).

---

## 5. Pages & Routing

### How routing works

There is no React Router. The `Page` type union in `App.tsx` drives all navigation:

```typescript
// src/App.tsx
export type Page = 'dashboard' | 'explorer' | 'gaps' | 'map' | 'reports' | 'settings' | 'census';

const [page, setPage] = useState<Page>('census'); // census is the default landing page

const renderPage = () => {
  switch (page) {
    case 'explorer': return <DataExplorerPage />;
    case 'gaps':     return <GapAnalysis />;
    case 'map':      return <DistrictMap />;
    case 'reports':  return <Reports />;
    case 'settings': return <Settings onNavigate={navigate} />;
    case 'census':   return <CensusPage />;
    default:         return <Dashboard />;
  }
};
```

`navigate(page: Page)` is passed down through props. The `Sidebar` calls it directly.

### Page reference

#### `census` — Census Overview (default landing page)

**File:** [src/pages/CensusPage.tsx](src/pages/CensusPage.tsx)

The landing page. Displays Rwanda 2022 Population and Housing Census data.

**Sections:**

- **Overview cards** — total population, sex ratio, population density, insurance coverage, primary school NAR, agricultural households %, electricity access
- **Sector tabs** — Population, Education, Health, Agriculture, Households. Each tab renders a `SectorPanel` with province/district-level breakdown
- **Regional chart** — horizontal bar chart of population by province or district (toggle `province` / `district`)
- **Population projections** — line chart showing medium/high/low scenarios to 2050
- **Deviations table** — color-coded matrix of district deviations from national averages across 6 indicators
- **Vulnerability scorecard** — ranked list of districts by composite vulnerability score

**API calls:**

```text
GET /api/census/overview/
GET /api/census/regional/?level=province|district
GET /api/census/sectors/{sector}/?level=province|district
GET /api/census/projections/
GET /api/census/deviations/
GET /api/census/vulnerability/
```

All queries use `staleTime: 60 * 60 * 1000` (1 hour cache) — census data does not change during a session.

---

#### `dashboard` — Data Observatory

**File:** [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)

Catalog-level overview of the NISR microdata catalog.

**Sections:**

- **KPI cards** (4): Total Studies, Total Resources, Average Quality Score, Data Gaps count
- **Studies by Type** — horizontal bar chart, color-coded by study type (Demographic & Health, Household Survey, Labour Force, etc.)
- **Studies by Year** — vertical bar chart showing study publication volume per year
- **Coverage Map** — Rwanda SVG map, districts shaded by study density
- **Data Gaps & Alerts** — expandable gap cards with affected study lists and action buttons (Submit / Correct / Request Update)
- **Recent Studies / AI Insights** — shows 6 most recent studies by default; clicking "AI Insights" replaces this with 3 Gemini-generated policy insights backed by Google Search

**Export:** PDF (section-selectable) and CSV (catalog summary).

**API call:**

```text
GET /api/catalog/?stats=1
```

---

#### `explorer` — Data Explorer

**File:** [src/pages/DataExplorerPage.tsx](src/pages/DataExplorerPage.tsx)

Study search, browse, and detail view.

**Features:**

- Full-text search with multi-token matching
- Filter by domain (Economic, Health, Education, Leadership, Cross-Cutting, Finance)
- Filter by status, resource type, minimum quality score
- Study cards showing: title, year, organization, domain badge, resource count, quality score
- Click a card to expand full detail: abstract, resources list with download links, quality report (completeness/accuracy/timeliness/consistency scores, disaggregation flags)

**Semantic search** is available via the `SemanticSearchBar` component which hits:

```text
GET /api/search/?q={query}&top_k=20
```

**Keyword search** hits:

```text
GET /api/catalog/?q={query}&year={year}&org={org}
GET /api/studies/?q={query}&domain={domain}&status={status}
```

The component falls back to static bundled study data (`STATIC_STUDIES` in `api.ts`) if the backend is unreachable.

---

#### `gaps` — Gap Analysis

**File:** [src/pages/GapAnalysis.tsx](src/pages/GapAnalysis.tsx)

Visualizes data completeness gaps across the catalog.

**Sections:**

- **Summary stats** — counts of critical/warning/info gaps, affected districts
- **Radar chart** — data completeness across domains (Economic, Health, Education, Leadership, Finance, Cross-Cutting)
- **Gap bar chart** — counts by domain
- **Gap item list** — each gap card shows: severity badge, domain tag, data completeness %, last reported date, recommendation, affected district count
- **District filter** — filter gaps to only those affecting selected districts (uses `DistrictContext`)
- **Domain filter** — show all or one domain
- **AI Brief generator** — sends gap data to Gemini and returns a structured advocacy brief

**CTA actions per gap:**

- **Submit Data** — opens `GapCtaModal` with `action: 'submit'`
- **Correct Info** — opens `GapCtaModal` with `action: 'correct'`
- **Request Update** — opens `GapCtaModal` with `action: 'request'`

All three submit to `POST /api/gap-actions/` on the backend.

**API calls:**

```text
GET /api/gaps/alerts/        <- live gap alerts from DB
GET /api/catalog/?stats=1    <- catalog-derived gap data
POST /api/gap-actions/       <- user submissions
```

Falls back to `FALLBACK_GAPS` static data if the backend returns nothing.

---

#### `map` — District Map

**File:** [src/pages/DistrictMap.tsx](src/pages/DistrictMap.tsx)

Full-page `RwandaMap` component. Shows all 30 districts shaded by study coverage density (study count / max count). Clicking a district adds it to the `DistrictContext` selection, which filters the Dashboard and Gap Analysis pages.

**API call:**

```text
GET /api/catalog/?coverage=1
```

Returns a map of `{ [districtId]: { study_count, max_count, most_recent_year, studies[] } }`.

---

#### `reports` — Data Contribution

**File:** [src/pages/Reports.tsx](src/pages/Reports.tsx)

A structured 6-section form for contributing new gender datasets to the platform.

| Section | Fields |
| --- | --- |
| 1. Contributor | Full name, email, role, GitHub |
| 2. Dataset Metadata | Title, sector, geographic coverage, time period, data format |
| 3. Methodology | Primary source, methodology, limitations, peer-reviewed, citation |
| 4. Access & Licensing | Access level (public/external/restricted), external link, license |
| 5. PII & Consent | Has PII flag, consent certification checkbox |
| 6. Submission | Dataset link, notes |

On submit, the form POSTs to `POST /api/gap-actions/` with `action_type: 'submit'`. Validation ensures PII consent is checked before submission is allowed.

---

#### `settings` — About Us

**File:** [src/pages/Settings.tsx](src/pages/Settings.tsx)

Project information page — team credits, hackathon context, data sources, and navigation shortcuts.

---

## 6. Component Inventory

### Layout

| Component | File | Description |
| --- | --- | --- |
| `Sidebar` | [src/components/Sidebar.tsx](src/components/Sidebar.tsx) | Left nav. Collapsible on desktop (64px <-> 256px). Slide-in drawer on mobile. Navigation hierarchy: Overview -> Data Explorer -> (Dashboard, Gap Analysis, District Map) -> Data Contribution -> About Us |
| `Header` | [src/components/Header.tsx](src/components/Header.tsx) | Top bar. Hamburger (mobile), platform title, Info button (reopens WelcomeConsent modal) |
| `WelcomeConsent` | [src/components/WelcomeConsent.tsx](src/components/WelcomeConsent.tsx) | Modal shown on first visit. Consent stored in `localStorage` under key `ddr_consent_accepted`. Can be reopened via the header Info button |

### Data display

| Component | File | Description |
| --- | --- | --- |
| `RwandaMap` | [src/components/RwandaMap.tsx](src/components/RwandaMap.tsx) | SVG map of Rwanda's 30 districts. Districts are shaded by study count (white to dark blue). Hover shows tooltip: district name, study count, most recent year, top study types. Click toggles district in `DistrictContext` |
| `MetricCard` | [src/components/MetricCard.tsx](src/components/MetricCard.tsx) | KPI card: domain-accented value, trend indicator, mini sparkline |
| `GapAlert` | [src/components/GapAlert.tsx](src/components/GapAlert.tsx) | Gap alert card with left border colored by severity (`critical` = red, `warning` = amber, `info` = blue) |
| `DataExplorer` | [src/components/DataExplorer.tsx](src/components/DataExplorer.tsx) | Study search UI. Renders filter bar + study card grid. Calls `fetchStudies()` and `fetchCatalogStats()` |

### Census sub-components

| Component | File | Description |
| --- | --- | --- |
| `OverviewCards` | [src/components/census/OverviewCards.tsx](src/components/census/OverviewCards.tsx) | 8 KPI cards from `/api/census/overview/` |
| `RegionalChart` | [src/components/census/RegionalChart.tsx](src/components/census/RegionalChart.tsx) | Recharts horizontal `BarChart` for population by province/district |
| `SectorPanel` | [src/components/census/SectorPanel.tsx](src/components/census/SectorPanel.tsx) | Renders sector-specific tables. Switches layout based on `sector` prop (`education`, `health`, `agriculture`, `households`) |
| `ProjectionChart` | [src/components/census/ProjectionChart.tsx](src/components/census/ProjectionChart.tsx) | Recharts `LineChart` with three scenarios (medium, high, low) from `/api/census/projections/` |
| `DeviationsTable` | [src/components/census/DeviationsTable.tsx](src/components/census/DeviationsTable.tsx) | Color-coded deviation matrix. Green = above national average, red = below. Indicators: primary NAR, insurance, electricity, water, firewood, agricultural HH% |
| `VulnerabilityScorecard` | [src/components/census/VulnerabilityScorecard.tsx](src/components/census/VulnerabilityScorecard.tsx) | Ranked district list by composite vulnerability score. Expandable rows show per-indicator breakdown |

### Interaction

| Component | File | Description |
| --- | --- | --- |
| `GapCtaModal` | [src/components/GapCtaModal.tsx](src/components/GapCtaModal.tsx) | Modal triggered from gap alert actions. Three action types: `submit` (add data), `correct` (fix error), `request` (ask for update). Collects name, email, message. Submits to `POST /api/gap-actions/` |
| `PdfExportModal` | [src/components/PdfExportModal.tsx](src/components/PdfExportModal.tsx) | Section-select checklist before PDF generation. Caller provides section IDs and labels. Passes `hiddenSections[]` to `generatePDF()` |
| `DistrictFilter` | [src/components/DistrictFilter.tsx](src/components/DistrictFilter.tsx) | Dropdown listing all 30 districts grouped by province. Toggles district selection in `DistrictContext` |
| `SemanticSearchBar` | [src/components/search/SemanticSearchBar.tsx](src/components/search/SemanticSearchBar.tsx) | Controlled text input. Debounces 400ms via `useDebounce`. Fires `GET /api/search/?q={q}&top_k=20`. Calls `onResults(results[])` prop |
| `SearchResultItem` | [src/components/search/SearchResultItem.tsx](src/components/search/SearchResultItem.tsx) | Single search result card. Shows source badge, relevance score, and result data fields |

---

## 7. API Layer

All network calls are centralized in **[src/lib/api.ts](src/lib/api.ts)**. This file exports:

1. **TypeScript interfaces** — `Metric`, `Insight`, `GapAlert`, `StudySummary`, `StudyDetail`, `StudyResource`, `StudyQualityReport`, `CatalogStats`, `CoverageMap`, `CensusOverview`, `CensusRegion`, `CensusProjection`, `CensusDeviationsData`, `CensusVulnerabilityData`, and more.

2. **Fetch functions** — one per API endpoint.

3. **Static fallback data** — `STATIC_STUDIES` and `STATIC_STUDIES_DETAIL` arrays used when the backend is unreachable. This ensures the UI never shows a blank screen during development.

### API base URLs

```typescript
// Standard endpoints (indicators, studies, gaps, insights)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Census endpoints (separate namespace)
const CENSUS_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/census`;
```

### Full endpoint map

| Function | Method + URL | Returns |
| --- | --- | --- |
| `fetchMetrics()` | `GET /api/indicators/metrics/` | `Metric[]` |
| `fetchInsights()` | `GET /api/insights/` | `Insight[]` |
| `fetchGapAlerts()` | `GET /api/gaps/alerts/` | `GapAlert[]` |
| `fetchIndicators(filters)` | `GET /api/indicators/` | `IndicatorSummary[]` |
| `fetchDetailedIndicator(id)` | `GET /api/indicators/{id}/detailed/` | `DetailedIndicator` |
| `fetchStudies(filters)` | `GET /api/studies/?{params}` | `StudySummary[]` |
| `fetchStudyDetail(id)` | `GET /api/studies/{id}/` | `StudyDetail` |
| `fetchCatalogStats()` | `GET /api/catalog/?stats=1` | `CatalogStats` |
| `fetchCoverageData()` | `GET /api/catalog/?coverage=1` | `CoverageMap` |
| `fetchCensusOverview()` | `GET /api/census/overview/` | `CensusOverview` |
| `fetchCensusRegional(level)` | `GET /api/census/regional/?level=` | `CensusRegionalData` |
| `fetchCensusSector(sector, level)` | `GET /api/census/sectors/{sector}/?level=` | sector-specific type |
| `fetchCensusProjections()` | `GET /api/census/projections/` | `{ projections: CensusProjection[] }` |
| `fetchCensusDeviations()` | `GET /api/census/deviations/` | `CensusDeviationsData` |
| `fetchCensusVulnerability()` | `GET /api/census/vulnerability/` | `CensusVulnerabilityData` |
| `getCensusExportUrl(sector)` | (URL builder, no fetch) | `string` |

### Response normalization

The API layer normalizes camelCase vs snake_case differences between the frontend and backend:

```typescript
// Example: Metric normalization
const normalizeMetric = (m: any): Metric => ({
  trendDirection: m.trendDirection ?? m.trend_direction,  // handles both
  timeRange:      m.timeRange      ?? m.time_range,
  chartData:      (m.chartData ?? m.chart_data ?? []).map((p: any) => ({
    value: p.y ?? p.value,    // handles both chart data shapes
  })),
  ...
});
```

---

## 8. State Management

### Server state — React Query

All remote data is fetched and cached via `@tanstack/react-query`. The `QueryClient` is created once in `App.tsx` and provided globally via `QueryClientProvider`.

**Cache keys used across the app:**

| Query key | Data | Cache strategy |
| --- | --- | --- |
| `['catalog-stats']` | Catalog KPIs, gaps, recent studies | Default (stale immediately) |
| `['census-overview']` | Census national stats | `staleTime: 1h` |
| `['census-regional', level]` | Province/district population | `staleTime: 1h` |
| `['census-sector', sector, level]` | Sector data | `staleTime: 1h` |
| `['census-projections']` | Population projections | `staleTime: 1h` |
| `['census-deviations']` | District deviations | `staleTime: 1h` |
| `['census-vulnerability']` | Vulnerability scores | `staleTime: 1h` |

Census data uses `staleTime: 3_600_000` (1 hour) because census figures are static — re-fetching on every navigation is wasteful.

**Usage pattern in pages:**

```typescript
const { data, isLoading, isError } = useQuery({
  queryKey: ['catalog-stats'],
  queryFn: fetchCatalogStats,
});

if (isLoading) return <SkeletonGrid />;
if (isError)   return <ErrorBanner message="Ensure Django is running at localhost:8000" />;
// render with `data`
```

### Client state — React Context

**`DistrictContext`** ([src/context/DistrictContext.tsx](src/context/DistrictContext.tsx)) is the only piece of shared client state. It holds the list of selected district IDs and exposes:

```typescript
interface DistrictContextType {
  selectedDistricts: string[];   // e.g. ['gasabo', 'musanze']
  allDistricts: District[];      // all 30 districts with id, name, province
  addDistrict(id: string): void;
  removeDistrict(id: string): void;
  toggleDistrict(id: string): void;
  clearDistricts(): void;
  isSelected(id: string): boolean;
}
```

Pages consume it via the `useDistricts()` hook. Selection on the map page automatically filters the Dashboard and Gap Analysis pages — no prop drilling required.

**`DistrictProvider`** wraps the app in `App.tsx`:

```typescript
<QueryClientProvider client={queryClient}>
  <DistrictProvider>
    {/* all pages */}
  </DistrictProvider>
</QueryClientProvider>
```

### Local state

Each page manages its own UI state (`useState`) — modal open/close, active tab, expanded card sets, loading flags. No global UI state store (Redux, Zustand) is used.

---

## 9. Design System

All brand colors, typography, and utility classes are defined in `tailwind.config.js` and `src/index.css`. Use these tokens everywhere — do not hardcode hex values in component files.

### Brand colors

| Token | Hex | Usage |
| --- | --- | --- |
| `rwanda-blue` | `#00A1DE` | Primary actions, active nav, links |
| `rwanda-yellow` | `#FAD201` | Accents, Economic domain |
| `rwanda-green` | `#20603D` | Education domain |
| `rich-black` | `#1A1A1A` | Body text, headings |
| `soft-black` | `#2D2D2D` | Secondary text |
| `dark-gray` | `#4A5568` | Muted text, labels |
| `medium-gray` | `#718096` | Placeholder text |
| `light-gray` | `#E2E8F0` | Borders, dividers |
| `off-white` | `#F7FAFC` | Page background, card backgrounds |

### Domain color map

Imported from [src/lib/designTokens.ts](src/lib/designTokens.ts) wherever a domain-keyed color is needed:

```typescript
import { domainColors } from '../lib/designTokens';

export const domainColors = {
  economic:     '#FAD201', // Rwanda Yellow
  health:       '#00A1DE', // Rwanda Blue
  education:    '#20603D', // Rwanda Green
  leadership:   '#E5BE01', // Rwanda Gold
  crossCutting: '#1A1A1A', // Rich Black
  finance:      '#7C3AED', // Purple
};
```

### Utility classes (defined in `index.css`)

| Class | Description |
| --- | --- |
| `btn-primary` | Filled blue button |
| `btn-ghost` | Outline / transparent button |
| `btn-accent` | Yellow accent button |
| `skeleton` | Animated loading shimmer (used as placeholder while `isLoading` is true) |
| `font-display` | Display typeface for headings |
| `font-mono` | Monospace for numbers and codes |

### Typography

- Headings: `font-display font-bold text-rich-black`
- Body: `font-sans text-dark-gray`
- Numbers/KPIs: `font-mono font-bold` with domain color
- Small labels: `text-xs uppercase tracking-wider font-semibold text-dark-gray`

---

## 10. Data Export

### CSV export

**File:** [src/lib/export.ts](src/lib/export.ts)

```typescript
exportToCSV(data: any[], filename: string)
```

Converts an array of objects to CSV, wraps cells containing commas in quotes, escapes inner quotes, and triggers a browser download via a temporary `<a>` element. The filename is appended with today's ISO date: `GDO_Catalog_Summary_2026-03-20.csv`.

**Used in:** Dashboard (`Export CSV` button), CensusPage (sector CSV download).

### PDF export

**File:** [src/lib/pdfExport.ts](src/lib/pdfExport.ts)

```typescript
generatePDF(
  elementId: string,       // DOM id to capture
  filename: string,        // output filename (without .pdf)
  title: string,           // title injected at top of PDF
  date: string,            // report date injected at top of PDF
  hiddenSections: string[] // DOM ids to hide before capture
)
```

**How it works:**

1. `PdfExportModal` collects which sections to include
2. Sections NOT selected are temporarily hidden via `element.style.display = 'none'`
3. `html2canvas` renders the visible DOM to a `<canvas>` at `scale: 2` (300 DPI equivalent)
4. `jsPDF` creates an A4 portrait document and tiles the canvas across pages
5. `pdf.save()` triggers the download
6. Hidden sections are restored to their original state

**Used in:** Dashboard, CensusPage.

---

## 11. AI Integration

The app uses **Google Gemini 2.0 Flash** via `@google/genai`.

### Dashboard — AI Insights

**File:** [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — `handleGenerateInsight()`

Triggered by the "AI Insights" button. Builds a context string from live catalog stats, then asks Gemini to return 3 current Rwanda gender policy insights backed by Google Search grounding.

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: `Based on: ${context}. What are the latest Rwanda gender data developments? Return JSON: [{type, headline}]`,
  config: {
    tools: [{ googleSearch: {} }],   // enables live web search grounding
    responseMimeType: 'application/json',
  },
});
```

The response is parsed as JSON and rendered as insight cards with a `Live Search` badge. If Gemini returns non-JSON or the key is missing, the section gracefully falls back to the Recent Studies list.

### Gap Analysis — AI Brief

**File:** [src/pages/GapAnalysis.tsx](src/pages/GapAnalysis.tsx)

Sends the current gap data to Gemini and returns a structured advocacy brief (plain text). Displayed in a modal. Uses the same `GoogleGenAI` client without Google Search grounding — the brief is generated from the provided gap data, not the live web.

### Key behavior

- If `GEMINI_API_KEY` is not set, the AI buttons are hidden or show a disabled state — the rest of the app works normally.
- Gemini calls are made **client-side**. The API key is embedded in the browser bundle. For production, proxy these calls through the Django backend to avoid key exposure.

---

## 12. Adding New Pages or Components

### Adding a new page

1. Create the page file in `src/pages/MyPage.tsx`

2. Add its key to the `Page` type in `src/App.tsx`:

   ```typescript
   export type Page = 'dashboard' | 'explorer' | ... | 'mypage';
   ```

3. Add a `case` in `renderPage()`:

   ```typescript
   case 'mypage': return <MyPage />;
   ```

4. Add a nav item to `Sidebar.tsx` in the appropriate `topItems`, `explorerSubItems`, or `bottomItems` array:

   ```typescript
   { page: 'mypage', label: 'My Page', icon: <SomeIcon className="w-5 h-5 shrink-0" /> }
   ```

### Adding a new API endpoint

1. Add the TypeScript interface for the response shape in `src/lib/api.ts`

2. Add the fetch function:

   ```typescript
   export const fetchMyData = async (): Promise<MyDataType> => {
     const res = await fetch(`${API_BASE_URL}/my-endpoint/`);
     if (!res.ok) throw new Error('fetch failed');
     return res.json();
   };
   ```

3. Use it in the page with `useQuery`:

   ```typescript
   const { data, isLoading } = useQuery({
     queryKey: ['my-data'],
     queryFn: fetchMyData,
   });
   ```

### Adding a new district-aware component

Consume `useDistricts()` to read or modify the global district selection:

```typescript
import { useDistricts } from '../context/DistrictContext';

function MyComponent() {
  const { selectedDistricts, toggleDistrict, clearDistricts } = useDistricts();
  // selectedDistricts is string[] of district IDs e.g. ['gasabo', 'musanze']
}
```

---

## 13. Backend Dependency

This frontend cannot function without the Django backend. The complete integration map:

| Frontend feature | Backend endpoint | Required data |
| --- | --- | --- |
| Census Overview page | `GET /api/census/overview/` | `CensusOverview` |
| Census regional charts | `GET /api/census/regional/` | `CensusRegionalData` |
| Census sector panels | `GET /api/census/sectors/{sector}/` | sector-specific |
| Population projections | `GET /api/census/projections/` | `CensusProjection[]` |
| Deviations table | `GET /api/census/deviations/` | `CensusDeviationsData` |
| Vulnerability scorecard | `GET /api/census/vulnerability/` | `CensusVulnerabilityData` |
| Dashboard KPIs | `GET /api/catalog/?stats=1` | `CatalogStats` |
| Coverage map | `GET /api/catalog/?coverage=1` | `CoverageMap` |
| Study search | `GET /api/catalog/?q=...` | study list |
| Study detail | `GET /api/catalog/?id=...` | single study + resources |
| Semantic search | `GET /api/search/?q=...` | FAISS results |
| Gap alerts | `GET /api/gaps/alerts/` | `GapAlert[]` |
| Gap actions (submit/correct/request) | `POST /api/gap-actions/` | logged to `data/gap_actions.log` |
| Dashboard metrics | `GET /api/indicators/metrics/` | `Metric[]` |
| AI Insights context | `GET /api/catalog/?stats=1` | used to build Gemini prompt |

### Starting the backend

```bash
cd "../UMUTIMA BACKEND"
source venv/bin/activate          # Windows: venv\Scripts\activate
python manage.py migrate
python manage.py load_csv_data    # import NISR study catalog
python manage.py runserver        # starts at http://localhost:8000
```

CORS is configured in the backend to allow `http://localhost:5173` (Vite default). If you change the Vite port, update `CORS_ALLOWED_ORIGINS` in the backend `.env.local`.

---

*All data displayed originates from publicly accessible NISR and MIGEPROF institutional repositories. No personally identifiable information is stored or processed by the frontend. Gender data is used strictly for policy research and advocacy.*
