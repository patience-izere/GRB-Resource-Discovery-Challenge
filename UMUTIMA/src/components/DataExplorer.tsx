import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainColors } from '../lib/designTokens';
import { useDistricts } from '../context/DistrictContext';
import { geographicScopeToDistrictIds } from '../lib/districtFiltering';
import { Search, Filter, ChevronLeft, AlertCircle, Download, ExternalLink, FileText, Database, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Types matching CatalogStudiesView response ────────────────────────────────

interface CatalogResource {
  type: string;
  name: string;
  label: string;
  url: string;
}

interface CatalogStudy {
  id: string;
  title: string;
  year: string;
  organization: string;
  abstract: string;
  study_type: string;
  geographic_scope: string;
  catalog_url: string;
  microdata_url: string;
  microdata_login_required?: boolean;
  data_access_type: string;
  quality_score: number;
  quality_rating: string;
  quality_flags: string;
  resource_count: number;
  resources?: CatalogResource[];
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const fetchCatalog = async (q: string, year: string, org: string): Promise<CatalogStudy[]> => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (year) params.append('year', year);
  if (org) params.append('org', org);
  const res = await fetch(`${API_BASE_URL}/catalog/?${params}`);
  if (!res.ok) throw new Error('catalog fetch failed');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
};

const fetchCatalogDetail = async (id: string): Promise<CatalogStudy> => {
  const res = await fetch(`${API_BASE_URL}/catalog/?id=${id}`);
  if (!res.ok) throw new Error('detail fetch failed');
  return await res.json();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inferDomain = (title: string, org: string): string => {
  const t = (title + ' ' + org).toLowerCase();
  if (t.includes('health') || t.includes('maternal') || t.includes('nutrition') || t.includes('hiv') || t.includes('malaria')) return 'health';
  if (t.includes('education') || t.includes('school') || t.includes('literacy') || t.includes('tvet')) return 'education';
  if (t.includes('labor') || t.includes('labour') || t.includes('employment') || t.includes('wage') || t.includes('economic') || t.includes('enterprise')) return 'economic';
  if (t.includes('governance') || t.includes('leadership') || t.includes('parliament') || t.includes('election')) return 'leadership';
  if (t.includes('budget') || t.includes('finance') || t.includes('fiscal') || t.includes('minecofin')) return 'finance';
  return 'crossCutting';
};

const domainLabel: Record<string, string> = {
  health: 'Health', education: 'Education', economic: 'Economic',
  leadership: 'Leadership', finance: 'Finance', crossCutting: 'Cross-Cutting',
};

const scoreColor = (score: number) =>
  score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';

const resourceIcon = (type: string) => {
  if (type === 'xls' || type === 'xlsx') return <Database className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

// ── Detail View ───────────────────────────────────────────────────────────────

function StudyDetail({ studyId, onBack }: { studyId: string; onBack: () => void }) {
  const { data: study, isLoading, isError } = useQuery({
    queryKey: ['catalog-detail', studyId],
    queryFn: () => fetchCatalogDetail(studyId),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-medium-gray">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading study...
    </div>
  );

  if (isError || !study) return (
    <div className="text-center py-12">
      <AlertCircle className="w-10 h-10 text-rwanda-yellow mx-auto mb-3" />
      <p className="text-dark-gray text-sm">Could not load study details.</p>
      <button onClick={onBack} className="btn-ghost mt-4 flex items-center gap-1 mx-auto text-sm">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
    </div>
  );

  const domain = inferDomain(study.title, study.organization);
  const color = (domainColors as any)[domain] ?? '#00A1DE';
  const resources = study.resources ?? [];
  const flags = (study.quality_flags || '').split(';').filter(Boolean);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-medium text-dark-gray hover:text-rwanda-blue flex items-center gap-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to catalog
      </button>

      {/* Study header */}
      <div className="bg-white rounded-xl border border-light-gray p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${color}18`, color }}>
                {domainLabel[domain]}
              </span>
              {study.year && <span className="text-xs text-dark-gray">{study.year}</span>}
              {study.data_access_type && (
                <span className="text-xs px-2 py-0.5 rounded bg-off-white border border-light-gray text-dark-gray">
                  {study.data_access_type}
                </span>
              )}
            </div>
            <h2 className="text-base font-display font-bold text-rich-black leading-snug">{study.title}</h2>
            <p className="text-xs text-dark-gray mt-1">{study.organization}</p>
          </div>
          {study.quality_score != null && (
            <div className="text-center shrink-0">
              <div className="text-xl font-bold" style={{ color: scoreColor(study.quality_score) }}>
                {Math.round(study.quality_score)}
              </div>
              <div className="text-[10px] text-dark-gray">Quality</div>
            </div>
          )}
        </div>

        {study.abstract && (
          <p className="text-sm text-dark-gray leading-relaxed">{study.abstract}</p>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-dark-gray pt-1">
          {study.study_type && <span><span className="font-medium text-soft-black">Type:</span> {study.study_type}</span>}
          {study.geographic_scope && <span><span className="font-medium text-soft-black">Coverage:</span> {study.geographic_scope}</span>}
          {study.resource_count > 0 && <span><span className="font-medium text-soft-black">Resources:</span> {study.resource_count}</span>}
        </div>

        <div className="flex gap-2 pt-1 flex-wrap">
          {study.catalog_url && (
            <a href={study.catalog_url} target="_blank" rel="noopener noreferrer"
              className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> View Catalog Page
            </a>
          )}
          {study.microdata_url && (
            <a href={study.microdata_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Get Microdata
              {study.microdata_login_required && <span className="text-[10px] ml-1">(login required)</span>}
            </a>
          )}
        </div>
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <h3 className="text-sm font-semibold text-rich-black mb-3">Resources ({resources.length})</h3>
          <div className="space-y-2">
            {resources.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-off-white border border-light-gray hover:border-rwanda-blue/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-dark-gray shrink-0">{resourceIcon(r.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-rich-black truncate">{r.label || r.name}</p>
                    <p className="text-[10px] text-dark-gray uppercase">{r.type}</p>
                  </div>
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-rwanda-blue hover:text-rwanda-blue/80 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality flags */}
      {flags.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <h3 className="text-sm font-semibold text-rich-black mb-3">Data Quality Flags</h3>
          <div className="flex flex-wrap gap-1.5">
            {flags.map((flag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                {flag.trim().replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main List View ────────────────────────────────────────────────────────────

export default function DataExplorer() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout>>();
  const { selectedDistricts } = useDistricts();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const { data: studies, isLoading, isError } = useQuery({
    queryKey: ['catalog', debouncedSearch, yearFilter, orgFilter],
    queryFn: () => fetchCatalog(debouncedSearch, yearFilter, orgFilter),
  });

  const years = Array.from(new Set((studies ?? []).map(s => s.year).filter(Boolean))).sort((a, b) => b.localeCompare(a));
  const orgs = Array.from(new Set((studies ?? []).map(s => s.organization).filter(Boolean))).sort();

  const filteredStudies = useMemo(() => {
    if (!studies) return [];
    if (selectedDistricts.length === 0) return studies;
    return studies.filter(study => {
      const ids = geographicScopeToDistrictIds(study.geographic_scope);
      if (ids.length === 0) return true; // unresolvable scope → always show
      return ids.some(id => selectedDistricts.includes(id));
    });
  }, [studies, selectedDistricts]);

  if (selectedId) {
    return <StudyDetail studyId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-light-gray p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
          <input
            type="text"
            placeholder="Search studies, organizations, topics..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-light-gray rounded-lg focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none bg-off-white"
          />
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="border border-light-gray rounded-lg px-2.5 py-2 text-sm focus:border-rwanda-blue outline-none bg-off-white">
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
            className="border border-light-gray rounded-lg px-2.5 py-2 text-sm focus:border-rwanda-blue outline-none bg-off-white max-w-[180px]">
            <option value="">All Organizations</option>
            {orgs.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {(yearFilter || orgFilter || debouncedSearch) && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); setYearFilter(''); setOrgFilter(''); }}
              className="text-sm text-dark-gray hover:text-rwanda-blue px-2 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-light-gray p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-rich-black flex items-center gap-2">
            {isLoading ? 'Loading...' : `${filteredStudies.length} studies found`}
            {selectedDistricts.length > 0 && (
              <span className="text-xs text-rwanda-green bg-[rgba(32,96,61,0.1)] px-2 py-1 rounded-full font-normal">
                {selectedDistricts.length} district{selectedDistricts.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <span className="text-xs text-dark-gray flex items-center gap-1">
            <Filter className="w-3 h-3" /> Rwanda Microdata Catalog
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 skeleton rounded-lg" />)}
          </div>
        ) : isError ? (
          <div className="text-center py-10">
            <AlertCircle className="w-8 h-8 text-rwanda-yellow mx-auto mb-3" />
            <p className="text-sm font-semibold text-rich-black">Could not connect to backend</p>
            <p className="text-xs text-dark-gray mt-1">Ensure Django is running at {API_BASE_URL}</p>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="text-center py-10 text-dark-gray text-sm">No studies match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filteredStudies.map(study => {
              const domain = inferDomain(study.title, study.organization);
              const color = (domainColors as any)[domain] ?? '#00A1DE';
              return (
                <div key={study.id}
                  onClick={() => setSelectedId(study.id)}
                  className="border border-light-gray rounded-lg p-3.5 hover:border-rwanda-blue hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-rich-black group-hover:text-rwanda-blue transition-colors line-clamp-2 leading-snug">
                      {study.title}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}>
                      {domainLabel[domain]}
                    </span>
                  </div>
                  {study.abstract && (
                    <p className="text-xs text-dark-gray line-clamp-2 mb-2">{study.abstract}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-dark-gray flex-wrap">
                    <span className="font-medium text-soft-black">{study.organization}</span>
                    {study.year && <span>{study.year}</span>}
                    {study.data_access_type && (
                      <span className="px-1.5 py-0.5 rounded bg-off-white border border-light-gray">
                        {study.data_access_type}
                      </span>
                    )}
                    {study.resource_count > 0 && <span>{study.resource_count} resources</span>}
                    {study.quality_score != null && (
                      <span style={{ color: scoreColor(study.quality_score) }} className="font-medium">
                        Q: {Math.round(study.quality_score)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
