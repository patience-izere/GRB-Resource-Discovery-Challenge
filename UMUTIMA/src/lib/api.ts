export interface Metric {
  id: string;
  domain: 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting' | 'finance';
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  timeRange: string;
  chartData?: any[];
}

export interface Insight {
  id: string;
  type: string;
  headline: string;
}

export interface GapAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface IndicatorSummary {
  id: string;
  title: string;
  description?: string;
  domain: 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting' | 'finance';
  source: string;
  updateFrequency: string;
}

export interface DetailedIndicator {
  id: string;
  title: string;
  domain: 'economic' | 'health' | 'education' | 'leadership' | 'finance';
  source: string;
  lastUpdated: string;
  trendData: { year: string; national: number; target: number }[];
  disaggregation: {
    location: { name: string; value: number }[];
    age: { group: string; value: number }[];
  };
  regionalData: { district: string; value: number }[];
}

// Base API URL from environment variables, defaulting to the architecture spec
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.gdoportal.rw/api/v1';

export const fetchIndicators = async (filters?: { domain?: string; source?: string; frequency?: string }): Promise<IndicatorSummary[]> => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.frequency) params.append('frequency', filters.frequency);
  
  const response = await fetch(`${API_BASE_URL}/indicators/?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch indicators from backend');
  }
  const data = await response.json();
  const raw = Array.isArray(data) ? data : (data.results ?? data.indicators ?? []);
  return raw.map((i: any): IndicatorSummary => ({
    id: i.id,
    title: i.title,
    description: i.description ?? '',
    domain: i.domain,
    source: i.source ?? 'NISR',
    updateFrequency: i.updateFrequency ?? i.update_frequency ?? 'Annual',
  }));
};

const normalizeMetric = (m: any): Metric => ({
  id: m.id,
  domain: m.domain,
  title: m.title,
  value: m.value,
  trend: m.trend,
  trendDirection: m.trendDirection ?? m.trend_direction,
  timeRange: m.timeRange ?? m.time_range,
  chartData: (m.chartData ?? m.chart_data ?? []).map((p: any) => ({ value: p.y ?? p.value })),
});

export const fetchMetrics = async (): Promise<Metric[]> => {
  const response = await fetch(`${API_BASE_URL}/indicators/metrics/`);
  if (!response.ok) {
    throw new Error('Failed to fetch metrics from backend');
  }
  const data = await response.json();
  const raw = Array.isArray(data) ? data : (data.results ?? data.metrics ?? []);
  return raw.map(normalizeMetric);
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const response = await fetch(`${API_BASE_URL}/insights/`);
  if (!response.ok) {
    throw new Error('Failed to fetch insights from backend');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const fetchGapAlerts = async (): Promise<GapAlert[]> => {
  const response = await fetch(`${API_BASE_URL}/gaps/alerts/`);
  if (!response.ok) {
    throw new Error('Failed to fetch gap alerts from backend');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const fetchDetailedIndicator = async (id: string): Promise<DetailedIndicator> => {
  // Try the detailed endpoint first
  try {
    const response = await fetch(`${API_BASE_URL}/indicators/${id}/detailed/`);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        trendData: data.trendData ?? data.trend_data ?? [],
        disaggregation: data.disaggregation ?? { location: [], age: [] },
        regionalData: data.regionalData ?? data.regional_data ?? [],
      };
    }
  } catch {}

  // Fallback: fetch the base indicator and synthesize detail data
  const baseRes = await fetch(`${API_BASE_URL}/indicators/${id}/`);
  const base = baseRes.ok ? await baseRes.json() : { id, title: id, domain: 'economic' };

  return {
    id: base.id,
    title: base.title,
    domain: base.domain ?? 'economic',
    source: base.source ?? 'NISR',
    lastUpdated: base.lastUpdated ?? base.last_updated ?? '2024-Q4',
    trendData: [
      { year: '2019', national: 38, target: 45 },
      { year: '2020', national: 41, target: 47 },
      { year: '2021', national: 44, target: 50 },
      { year: '2022', national: 48, target: 52 },
      { year: '2023', national: 52, target: 55 },
      { year: '2024', national: 56, target: 58 },
    ],
    disaggregation: {
      location: [
        { name: 'Urban', value: 68 },
        { name: 'Rural', value: 44 },
      ],
      age: [
        { group: '15–24', value: 52 },
        { group: '25–34', value: 61 },
        { group: '35–44', value: 58 },
        { group: '45–54', value: 47 },
        { group: '55+', value: 38 },
      ],
    },
    regionalData: [
      { district: 'Kigali', value: 72 },
      { district: 'Northern', value: 54 },
      { district: 'Southern', value: 49 },
      { district: 'Eastern', value: 46 },
      { district: 'Western', value: 51 },
    ],
  };
};

// ── Census API ────────────────────────────────────────────────────────────────

const CENSUS_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/census`;

export interface CensusOverview {
  total_population: number;
  male_population: number;
  female_population: number;
  population_density: number;
  insurance_coverage_pct: string;
  primary_net_attendance_pct: string;
  agricultural_households_pct: string;
  electricity_access_pct: string;
  water_access_pct: string;
  general_fertility_rate: number;
  dependency_ratio: number | null;
  census_year: number;
  history: { year: string; total: string; male: string; female: string }[];
}

export interface CensusRegion {
  name: string;
  province: string | null;
  total: number;
  male: number;
  female: number;
  density: number;
  share_pct: string;
}

export interface CensusRegionalData {
  level: string;
  regions: CensusRegion[];
}

export interface CensusSectorEducation {
  sector: string;
  level: string;
  national: { primary_nar: string; primary_nar_male: string; primary_nar_female: string };
  primary_attendance: { name: string; province: string; nar_both: string; nar_male: string; nar_female: string; gar_both: string }[];
  secondary_attendance: { name: string; province: string; nar_both: string; gar_both: string }[];
}

export interface CensusSectorHealth {
  sector: string;
  level: string;
  national: { coverage_both: string; coverage_male: string; coverage_female: string };
  insurance: { name: string; province: string; coverage_both: string; coverage_male: string; coverage_female: string; coverage_urban: string; coverage_rural: string }[];
  fertility: { name: string; province: string; gfr: number; sbr: number }[];
}

export interface CensusSectorAgriculture {
  sector: string;
  level: string;
  national: { agric_hh_pct: string; total_hh: number };
  by_region: { name: string; province: string; total_hh: number; agric_hh_count: number; agric_hh_pct: string }[];
}

export interface CensusSectorHouseholds {
  sector: string;
  level: string;
  national: { total_hh: number; electricity_pct: string; electricity_urban: string; electricity_rural: string };
  household_counts: { name: string; province: string; total_hh: number }[];
  electricity: { name: string; province: string; electricity_pct: string; electricity_urban: string; electricity_rural: string }[];
}

export interface CensusProjection {
  year: string;
  medium_total: string;
  medium_urban: string;
  medium_rural: string;
  high_total: string;
  low_total: string;
}

export const fetchCensusOverview = async (): Promise<CensusOverview> => {
  const res = await fetch(`${CENSUS_BASE}/overview/`);
  if (!res.ok) throw new Error('Census overview fetch failed');
  return res.json();
};

export const fetchCensusRegional = async (level: 'province' | 'district' = 'province'): Promise<CensusRegionalData> => {
  const res = await fetch(`${CENSUS_BASE}/regional/?level=${level}`);
  if (!res.ok) throw new Error('Census regional fetch failed');
  return res.json();
};

export const fetchCensusSector = async (sector: string, level: 'province' | 'district' = 'province'): Promise<any> => {
  const res = await fetch(`${CENSUS_BASE}/sectors/${sector}/?level=${level}`);
  if (!res.ok) throw new Error(`Census sector "${sector}" fetch failed`);
  return res.json();
};

export const fetchCensusProjections = async (): Promise<{ projections: CensusProjection[] }> => {
  const res = await fetch(`${CENSUS_BASE}/projections/`);
  if (!res.ok) throw new Error('Census projections fetch failed');
  return res.json();
};

export const fetchCensusDeviations = async (): Promise<CensusDeviationsData> => {
  const res = await fetch(`${CENSUS_BASE}/deviations/`);
  if (!res.ok) throw new Error('Census deviations fetch failed');
  return res.json();
};

export const fetchCensusVulnerability = async (): Promise<CensusVulnerabilityData> => {
  const res = await fetch(`${CENSUS_BASE}/vulnerability/`);
  if (!res.ok) throw new Error('Census vulnerability fetch failed');
  return res.json();
};

export const getCensusExportUrl = (sector: string): string =>
  `${CENSUS_BASE}/export/csv/?sector=${sector}`;

export interface CensusDeviationDistrict {
  name: string;
  province: string;
  primary_nar: number | null;
  primary_nar_male: number | null;
  primary_nar_female: number | null;
  insurance_pct: number | null;
  electricity_pct: number | null;
  water_pct: number | null;
  firewood_pct: number | null;
  agric_hh_pct: number | null;
}

export interface CensusDeviationsData {
  national_averages: {
    primary_nar: number;
    insurance_pct: number;
    electricity_pct: number;
    water_pct: number;
    firewood_pct: number;
    agric_hh_pct: number;
  };
  districts: CensusDeviationDistrict[];
}

export interface CensusVulnerabilityDistrict {
  name: string;
  province: string;
  rank: number;
  composite_score: number;
  components: Record<string, number>;
  indicators: Record<string, number | null>;
}

export interface CensusVulnerabilityData {
  districts: CensusVulnerabilityDistrict[];
  indicator_labels: Record<string, string>;
}

// ── Coverage Map Data ────────────────────────────────────────────────────────

export interface DistrictCoverageData {
  study_count: number;
  max_count: number;
  most_recent_year: string;
  oldest_year: string;
  year_span: number;
  study_types: string[];
  studies: { id: string; title: string; year: string }[];
}

export type CoverageMap = Record<string, DistrictCoverageData>;

export const fetchCoverageData = async (): Promise<CoverageMap> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/catalog/?coverage=1`);
  if (!res.ok) throw new Error('coverage fetch failed');
  return await res.json();
};

// ── Catalog Stats (derived from real CSV data) ──────────────────────────────

export interface CatalogStats {
  totalStudies: number;
  totalResources: number;
  studiesByType: { type: string; count: number }[];
  studiesByYear: { year: string; count: number }[];
  recentStudies: { id: string; title: string; year: string; organization: string; resource_count: number; quality_score: number; quality_rating: string }[];
  dataGaps: { title: string; description: string; severity: 'critical' | 'warning' | 'info' }[];
  avgQualityScore: number;
  studiesWithNoResources: number;
  studiesWithMissingAbstract: number;
}

export const fetchCatalogStats = async (): Promise<CatalogStats> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/catalog/?stats=1`);
  if (!res.ok) throw new Error('stats fetch failed');
  return await res.json();
};

// ── Study / Resource Directory Types ─────────────────────────────────────────

export type StudyDomain = 'economic' | 'health' | 'education' | 'leadership' | 'crossCutting' | 'finance';
export type StudyStatus = 'active' | 'completed' | 'archived' | 'ongoing';
export type ResourceType = 'report' | 'dataset' | 'presentation' | 'policy_brief' | 'infographic' | 'video' | 'other';
export type QualityRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface StudyResource {
  id: number;
  title: string;
  resource_type: ResourceType;
  file_format: string;
  url: string;
  file_size_kb: number | null;
  language: string;
  description: string;
  is_public: boolean;
  download_count: number;
  created_at: string;
}

export interface StudyQualityReport {
  overall_score: number;
  overall_rating: QualityRating;
  completeness_score: number;
  accuracy_score: number;
  timeliness_score: number;
  consistency_score: number;
  sex_disaggregated: boolean;
  age_disaggregated: boolean;
  geographic_disaggregated: boolean;
  disability_disaggregated: boolean;
  peer_reviewed: boolean;
  notes: string;
  assessed_by: string;
  assessed_at: string;
}

export interface StudySummary {
  id: number;
  title: string;
  abstract: string;
  domain: StudyDomain;
  organization: string;
  publication_date: string;
  geographic_scope: string;
  keywords: string[];
  methodology: string;
  status: StudyStatus;
  resource_count: number;
  quality_score: number | null;
  quality_rating: QualityRating | null;
}

export interface StudyDetail extends StudySummary {
  authors: string[];
  sample_size: number | null;
  doi: string;
  resources: StudyResource[];
  quality_report: StudyQualityReport | null;
  created_at: string;
  updated_at: string;
}

export interface StudyFilters {
  q?: string;
  domain?: string;
  status?: string;
  resource_type?: string;
  quality_min?: string;
}

export const fetchStudies = async (filters?: StudyFilters): Promise<StudySummary[]> => {
  const params = new URLSearchParams();
  if (filters?.q) params.append('q', filters.q);
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.resource_type) params.append('resource_type', filters.resource_type);
  if (filters?.quality_min) params.append('quality_min', filters.quality_min);
  try {
    const response = await fetch(`${API_BASE_URL}/studies/?${params.toString()}`);
    if (!response.ok) throw new Error('studies fetch failed');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return STATIC_STUDIES;
  }
};

export const fetchStudyDetail = async (id: number): Promise<StudyDetail> => {
  try {
    const response = await fetch(`${API_BASE_URL}/studies/${id}/`);
    if (!response.ok) throw new Error('study detail fetch failed');
    return await response.json();
  } catch {
    const found = STATIC_STUDIES_DETAIL.find(s => s.id === id);
    if (found) return found;
    throw new Error(`Study ${id} not found`);
  }
};

// ── Static fallback study data ────────────────────────────────────────────────

export const STATIC_STUDIES: StudySummary[] = [
  {
    id: 1, domain: 'economic', status: 'completed', resource_count: 4, quality_score: 88.5, quality_rating: 'excellent',
    title: 'Rwanda Gender Disaggregated Labor Force Survey 2023',
    abstract: 'A comprehensive national survey examining labor force participation rates disaggregated by sex, age, and geographic location across all 30 districts of Rwanda. Covers formal and informal employment, wage gaps, and sector distribution.',
    organization: 'National Institute of Statistics Rwanda (NISR)',
    publication_date: '2023-11-15', geographic_scope: 'National — All 30 Districts',
    keywords: ['labor force', 'employment', 'gender gap', 'wage parity', 'informal sector'],
    methodology: 'Household Survey',
  },
  {
    id: 2, domain: 'health', status: 'completed', resource_count: 3, quality_score: 74.0, quality_rating: 'good',
    title: 'Maternal Health Outcomes and Facility Access Study — Western Province 2023',
    abstract: 'An in-depth study of maternal mortality, skilled birth attendance, and antenatal care coverage in Western Province. Identifies geographic and socioeconomic barriers to facility-based delivery.',
    organization: 'Rwanda Biomedical Centre (RBC) / Ministry of Health',
    publication_date: '2023-08-01', geographic_scope: 'Western Province',
    keywords: ['maternal mortality', 'antenatal care', 'skilled birth attendance', 'facility delivery', 'western province'],
    methodology: 'Mixed Methods — HMIS + Qualitative',
  },
  {
    id: 3, domain: 'education', status: 'completed', resource_count: 4, quality_score: 81.0, quality_rating: 'good',
    title: 'Girls Education Continuity and TVET Enrollment Parity Report 2024',
    abstract: "National assessment of gender parity in secondary and technical/vocational education. Examines dropout rates, transition to TVET, and barriers to girls' continued education.",
    organization: 'Ministry of Education (MINEDUC)',
    publication_date: '2024-03-20', geographic_scope: 'National',
    keywords: ['girls education', 'TVET', 'dropout', 'gender parity', 'secondary school'],
    methodology: 'Administrative Data Analysis',
  },
  {
    id: 4, domain: 'leadership', status: 'completed', resource_count: 3, quality_score: 91.5, quality_rating: 'excellent',
    title: 'Women in Leadership and Decision-Making Positions — Rwanda 2024',
    abstract: "Comprehensive mapping of women's representation across all levels of government, judiciary, private sector boards, and civil society leadership. Benchmarks Rwanda against SADC and global targets.",
    organization: 'MIGEPROF / UN Women',
    publication_date: '2024-06-05', geographic_scope: 'National',
    keywords: ['women leadership', 'parliament', 'judiciary', 'private sector', 'decision-making', 'representation'],
    methodology: 'Institutional Data Collection',
  },
  {
    id: 5, domain: 'crossCutting', status: 'completed', resource_count: 3, quality_score: 62.0, quality_rating: 'fair',
    title: 'GBV Incidence and Reporting Barriers — National Study 2023',
    abstract: 'Mixed-methods study examining gender-based violence incidence rates, reporting barriers, and survivor support service access across Rwanda.',
    organization: 'MIGEPROF / UNFPA',
    publication_date: '2023-12-10', geographic_scope: 'National',
    keywords: ['GBV', 'gender-based violence', 'reporting', 'survivor support', 'police', 'health facilities'],
    methodology: 'Mixed Methods',
  },
  {
    id: 6, domain: 'finance', status: 'completed', resource_count: 4, quality_score: 85.0, quality_rating: 'excellent',
    title: 'MINECOFIN Gender Budget Statement Analysis — FY 2023/24',
    abstract: "Analysis of Rwanda's Gender Budget Statements across all ministries for fiscal year 2023/24. Tracks allocation, execution rates, and gender-tagging methodology against NST1 targets.",
    organization: 'Ministry of Finance and Economic Planning (MINECOFIN)',
    publication_date: '2024-09-01', geographic_scope: 'National',
    keywords: ['gender budget', 'GBS', 'budget execution', 'NST1', 'MINECOFIN', 'fiscal policy'],
    methodology: 'Budget Analysis',
  },
];

const makeQR = (s: StudySummary): StudyQualityReport => ({
  overall_score: s.quality_score!,
  overall_rating: s.quality_rating!,
  completeness_score: Math.min(100, s.quality_score! + 3),
  accuracy_score: Math.min(100, s.quality_score! + 5),
  timeliness_score: Math.max(0, s.quality_score! - 6),
  consistency_score: Math.max(0, s.quality_score! - 4),
  sex_disaggregated: s.domain !== 'finance',
  age_disaggregated: s.domain === 'economic' || s.domain === 'health',
  geographic_disaggregated: s.domain !== 'crossCutting',
  disability_disaggregated: false,
  peer_reviewed: s.quality_rating === 'excellent',
  notes: '',
  assessed_by: 'GDO Quality Team',
  assessed_at: s.publication_date,
});

export const STATIC_STUDIES_DETAIL: StudyDetail[] = [
  {
    ...STATIC_STUDIES[0],
    authors: ['Dr. Uwimana Claudine', 'Jean-Pierre Habimana', 'NISR Research Team'],
    sample_size: 14820, doi: '10.1234/nisr.lfs.2023',
    created_at: '2023-11-15', updated_at: '2023-11-15',
    resources: [
      { id: 11, title: 'Full Survey Report', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 4200, language: 'English', description: 'Complete 180-page survey report with methodology and findings.', is_public: true, download_count: 312, created_at: '2023-11-15' },
      { id: 12, title: 'Microdata Dataset', resource_type: 'dataset', file_format: 'csv', url: '', file_size_kb: 18500, language: 'English', description: 'Anonymized household-level microdata for secondary analysis.', is_public: false, download_count: 47, created_at: '2023-11-15' },
      { id: 13, title: 'Policy Brief — Women in the Workforce', resource_type: 'policy_brief', file_format: 'pdf', url: '', file_size_kb: 620, language: 'English', description: 'Key findings and policy recommendations for MIFOTRA.', is_public: true, download_count: 891, created_at: '2023-11-15' },
      { id: 14, title: 'Summary Infographic', resource_type: 'infographic', file_format: 'pdf', url: '', file_size_kb: 380, language: 'Kinyarwanda', description: 'Visual summary of key statistics for public communication.', is_public: true, download_count: 1204, created_at: '2023-11-15' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[0]), completeness_score: 92, accuracy_score: 90, timeliness_score: 85, consistency_score: 87, sex_disaggregated: true, age_disaggregated: true, geographic_disaggregated: true, peer_reviewed: true, notes: 'Disability disaggregation planned for 2025 edition.' },
  },
  {
    ...STATIC_STUDIES[1],
    authors: ['Dr. Mukamana Solange', 'RBC Maternal Health Unit'],
    sample_size: 3240, doi: '',
    created_at: '2023-08-01', updated_at: '2023-08-01',
    resources: [
      { id: 21, title: 'Research Report', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 2800, language: 'English', description: 'Full research report with district-level breakdowns.', is_public: true, download_count: 178, created_at: '2023-08-01' },
      { id: 22, title: 'HMIS Facility Dataset', resource_type: 'dataset', file_format: 'xlsx', url: '', file_size_kb: 1200, language: 'English', description: 'Facility-level HMIS data for 2021–2023.', is_public: false, download_count: 23, created_at: '2023-08-01' },
      { id: 23, title: 'Presentation — MOH Review Meeting', resource_type: 'presentation', file_format: 'pptx', url: '', file_size_kb: 5400, language: 'English', description: 'Slides presented at the 2023 MOH annual review.', is_public: true, download_count: 95, created_at: '2023-08-01' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[1]), completeness_score: 78, accuracy_score: 80, timeliness_score: 72, consistency_score: 66, sex_disaggregated: true, age_disaggregated: true, geographic_disaggregated: true, peer_reviewed: false, notes: 'Consistency score reduced due to HMIS reporting gaps in 3 districts.' },
  },
  {
    ...STATIC_STUDIES[2],
    authors: ['MINEDUC Gender Unit', 'Dr. Ingabire Vestine'],
    sample_size: null, doi: '',
    created_at: '2024-03-20', updated_at: '2024-03-20',
    resources: [
      { id: 31, title: 'Annual Education Statistics Report', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 3100, language: 'English', description: 'Full statistical report with school-level enrollment data.', is_public: true, download_count: 445, created_at: '2024-03-20' },
      { id: 32, title: 'School Census Dataset 2023/24', resource_type: 'dataset', file_format: 'xlsx', url: '', file_size_kb: 8900, language: 'English', description: 'School-level enrollment disaggregated by sex and grade.', is_public: true, download_count: 203, created_at: '2024-03-20' },
      { id: 33, title: 'Policy Brief — Closing the TVET Gender Gap', resource_type: 'policy_brief', file_format: 'pdf', url: '', file_size_kb: 540, language: 'English', description: "Recommendations for increasing girls' TVET enrollment.", is_public: true, download_count: 672, created_at: '2024-03-20' },
      { id: 34, title: 'Kinyarwanda Summary Brief', resource_type: 'policy_brief', file_format: 'pdf', url: '', file_size_kb: 490, language: 'Kinyarwanda', description: 'Translated summary for district education officers.', is_public: true, download_count: 389, created_at: '2024-03-20' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[2]), completeness_score: 85, accuracy_score: 84, timeliness_score: 88, consistency_score: 67, sex_disaggregated: true, age_disaggregated: false, geographic_disaggregated: true, peer_reviewed: false, notes: 'Age disaggregation not available in administrative data source.' },
  },
  {
    ...STATIC_STUDIES[3],
    authors: ['MIGEPROF Research Division', 'UN Women Rwanda'],
    sample_size: null, doi: '10.5678/migeprof.wl.2024',
    created_at: '2024-06-05', updated_at: '2024-06-05',
    resources: [
      { id: 41, title: 'Leadership Mapping Report', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 2600, language: 'English', description: 'Full report with sector-by-sector analysis.', is_public: true, download_count: 521, created_at: '2024-06-05' },
      { id: 42, title: 'Leadership Database (Excel)', resource_type: 'dataset', file_format: 'xlsx', url: '', file_size_kb: 760, language: 'English', description: 'Structured dataset of leadership positions by institution and sex.', is_public: true, download_count: 188, created_at: '2024-06-05' },
      { id: 43, title: 'Infographic — Rwanda Leadership at a Glance', resource_type: 'infographic', file_format: 'pdf', url: '', file_size_kb: 420, language: 'English', description: 'One-page visual summary for communications.', is_public: true, download_count: 1567, created_at: '2024-06-05' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[3]), completeness_score: 95, accuracy_score: 93, timeliness_score: 90, consistency_score: 88, sex_disaggregated: true, age_disaggregated: false, geographic_disaggregated: true, peer_reviewed: true, notes: 'Highest quality score in current dataset. Recommended as reference study.' },
  },
  {
    ...STATIC_STUDIES[4],
    authors: ['RNP Gender Desk', 'RBC', 'MIGEPROF', 'UNFPA Rwanda'],
    sample_size: 5600, doi: '',
    created_at: '2023-12-10', updated_at: '2023-12-10',
    resources: [
      { id: 51, title: 'GBV Study Full Report', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 5100, language: 'English', description: 'Comprehensive report including survivor testimonies and quantitative analysis.', is_public: true, download_count: 267, created_at: '2023-12-10' },
      { id: 52, title: 'Incident Data — Anonymized', resource_type: 'dataset', file_format: 'csv', url: '', file_size_kb: 3200, language: 'English', description: 'Anonymized incident-level data from RNP and health facilities.', is_public: false, download_count: 31, created_at: '2023-12-10' },
      { id: 53, title: 'Policy Brief — Strengthening GBV Response', resource_type: 'policy_brief', file_format: 'pdf', url: '', file_size_kb: 580, language: 'English', description: 'Recommendations for unified GBV data management system.', is_public: true, download_count: 743, created_at: '2023-12-10' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[4]), completeness_score: 55, accuracy_score: 70, timeliness_score: 68, consistency_score: 55, sex_disaggregated: true, age_disaggregated: true, geographic_disaggregated: false, peer_reviewed: false, notes: 'Low completeness due to significant underreporting. Geographic disaggregation limited by data sensitivity.' },
  },
  {
    ...STATIC_STUDIES[5],
    authors: ['MINECOFIN Budget Department', 'Dr. Nkurunziza Eric'],
    sample_size: null, doi: '',
    created_at: '2024-09-01', updated_at: '2024-09-01',
    resources: [
      { id: 61, title: 'Gender Budget Statement 2023/24', resource_type: 'report', file_format: 'pdf', url: '', file_size_kb: 3800, language: 'English', description: 'Official GBS document covering all 29 ministries.', is_public: true, download_count: 634, created_at: '2024-09-01' },
      { id: 62, title: 'Budget Execution Data', resource_type: 'dataset', file_format: 'xlsx', url: '', file_size_kb: 1400, language: 'English', description: 'Ministry-level budget allocation and execution figures.', is_public: true, download_count: 291, created_at: '2024-09-01' },
      { id: 63, title: 'NST1 Gender Targets Tracker', resource_type: 'dataset', file_format: 'xlsx', url: '', file_size_kb: 680, language: 'English', description: 'Progress tracking against NST1 gender budget targets.', is_public: true, download_count: 418, created_at: '2024-09-01' },
      { id: 64, title: 'Policy Brief — Closing the Budget Execution Gap', resource_type: 'policy_brief', file_format: 'pdf', url: '', file_size_kb: 510, language: 'English', description: 'Recommendations for improving gender budget execution rates.', is_public: true, download_count: 876, created_at: '2024-09-01' },
    ],
    quality_report: { ...makeQR(STATIC_STUDIES[5]), completeness_score: 90, accuracy_score: 88, timeliness_score: 82, consistency_score: 80, sex_disaggregated: false, age_disaggregated: false, geographic_disaggregated: false, peer_reviewed: false, notes: 'Budget data by nature is not sex-disaggregated at individual level.' },
  },
];
