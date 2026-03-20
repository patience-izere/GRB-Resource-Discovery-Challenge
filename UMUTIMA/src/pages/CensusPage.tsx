import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Users, BookOpen, Activity, Wheat, Home, TrendingUp, AlertCircle, AlertTriangle, BarChart2 } from 'lucide-react';

import {
  fetchCensusOverview,
  fetchCensusRegional,
  fetchCensusSector,
  fetchCensusProjections,
  fetchCensusDeviations,
  fetchCensusVulnerability,
  getCensusExportUrl,
} from '../lib/api';
import { generatePDF } from '../lib/pdfExport';
import { exportToCSV } from '../lib/export';

import OverviewCards from '../components/census/OverviewCards';
import RegionalChart from '../components/census/RegionalChart';
import SectorPanel from '../components/census/SectorPanel';
import ProjectionChart from '../components/census/ProjectionChart';
import DeviationsTable from '../components/census/DeviationsTable';
import VulnerabilityScorecard from '../components/census/VulnerabilityScorecard';

type Sector = 'population' | 'education' | 'health' | 'agriculture' | 'households';
type Level = 'province' | 'district';

const SECTORS: { id: Sector; label: string; icon: React.ReactNode }[] = [
  { id: 'population',  label: 'Population',  icon: <Users className="w-4 h-4" /> },
  { id: 'education',   label: 'Education',   icon: <BookOpen className="w-4 h-4" /> },
  { id: 'health',      label: 'Health',      icon: <Activity className="w-4 h-4" /> },
  { id: 'agriculture', label: 'Agriculture', icon: <Wheat className="w-4 h-4" /> },
  { id: 'households',  label: 'Households',  icon: <Home className="w-4 h-4" /> },
];

export default function CensusPage() {
  const [activeSector, setActiveSector] = useState<Sector>('population');
  const [level, setLevel] = useState<Level>('province');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeInsightTab, setActiveInsightTab] = useState<'deviations' | 'vulnerability'>('deviations');

  const { data: overview, isLoading: overviewLoading, isError: overviewError } = useQuery({
    queryKey: ['census-overview'],
    queryFn: fetchCensusOverview,
    staleTime: 1000 * 60 * 60,
  });

  const { data: regional, isLoading: regionalLoading } = useQuery({
    queryKey: ['census-regional', level],
    queryFn: () => fetchCensusRegional(level),
    staleTime: 1000 * 60 * 60,
  });

  const { data: sectorData, isLoading: sectorLoading } = useQuery({
    queryKey: ['census-sector', activeSector, level],
    queryFn: () => fetchCensusSector(activeSector, level),
    staleTime: 1000 * 60 * 60,
  });

  const { data: projections, isLoading: projLoading } = useQuery({
    queryKey: ['census-projections'],
    queryFn: fetchCensusProjections,
    staleTime: 1000 * 60 * 60,
  });

  const { data: deviations, isLoading: deviationsLoading } = useQuery({
    queryKey: ['census-deviations'],
    queryFn: fetchCensusDeviations,
    staleTime: 1000 * 60 * 60,
  });

  const { data: vulnerability, isLoading: vulnerabilityLoading } = useQuery({
    queryKey: ['census-vulnerability'],
    queryFn: fetchCensusVulnerability,
    staleTime: 1000 * 60 * 60,
  });

  const handleExportCSV = () => {
    const url = getCensusExportUrl(activeSector);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwanda_census_2022_${activeSector}.csv`;
    a.click();
  };

  const handleExportOverviewCSV = () => {
    if (!overview) return;
    exportToCSV(overview.history, 'rwanda_census_population_history');
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await generatePDF(
        'census-export-target',
        'Rwanda_Census_2022_Analysis',
        'Rwanda Population & Housing Census 2022 — Analysis Report',
        new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' }),
        []
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-display font-bold text-rich-black flex items-center gap-2">
            <Users className="w-5 h-5 text-rwanda-blue" />
            Population Analysis — Rwanda PHC
          </h1>
          <p className="text-dark-gray text-sm">
            Population and Housing Census • Source: NISR •{' '}
            <span className="font-medium text-rwanda-blue">13.2M residents</span>
            {overview?.dependency_ratio != null && (
              <> · <span className="font-medium text-dark-gray">Dependency ratio: {overview.dependency_ratio}%</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level toggle */}
          <div className="flex rounded-lg border border-light-gray overflow-hidden text-xs font-medium">
            {(['province', 'district'] as Level[]).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  level === l
                    ? 'bg-rwanda-blue text-white'
                    : 'bg-white text-dark-gray hover:bg-off-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs disabled:opacity-60"
          >
            <FileText className="w-3.5 h-3.5" />
            {isExportingPdf ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div id="census-export-target" className="space-y-4">

        {/* National overview quick-stat cards */}
        <section>
          <h2 className="text-sm font-display font-semibold text-rich-black mb-2">National Overview</h2>
          {overviewLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-xl" />
              ))}
            </div>
          ) : overviewError ? (
            <div className="bg-white rounded-xl border border-light-gray p-6 text-center text-sm text-dark-gray">
              <AlertCircle className="w-6 h-6 text-rwanda-yellow mx-auto mb-2" />
              Could not load census data. Ensure Django is running at localhost:8000 and the census
              database is present at <code className="text-xs bg-off-white px-1 rounded">data/census/rwanda_census.db</code>.
            </div>
          ) : overview ? (
            <OverviewCards data={overview} />
          ) : null}
        </section>

        {/* Sector tabs */}
        <section>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h2 className="text-sm font-display font-semibold text-rich-black mr-1">Sectoral Indicators</h2>
            {SECTORS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSector(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeSector === s.id
                    ? 'bg-rwanda-blue text-white border-rwanda-blue'
                    : 'bg-white text-dark-gray border-light-gray hover:border-rwanda-blue hover:text-rwanda-blue'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {sectorLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
              </div>
              <div className="h-64 skeleton rounded-xl" />
              <div className="h-48 skeleton rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Population: regional chart + sector panel */}
              {activeSector === 'population' && (
                <div className="space-y-4">
                  {regionalLoading ? (
                    <div className="space-y-3">
                      <div className="h-64 skeleton rounded-xl" />
                      <div className="h-48 skeleton rounded-xl" />
                    </div>
                  ) : regional ? (
                    <RegionalChart regions={regional.regions} level={level} />
                  ) : null}
                  {sectorData && <SectorPanel sector="population" data={sectorData} level={level} />}
                </div>
              )}

              {/* Other sectors */}
              {activeSector !== 'population' && sectorData && (
                <SectorPanel sector={activeSector} data={sectorData} level={level} />
              )}
            </div>
          )}
        </section>

        {/* Population projections */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-rwanda-blue" />
            <h2 className="text-sm font-display font-semibold text-rich-black">Population Projections</h2>
          </div>
          {projLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : projections ? (
            <ProjectionChart projections={projections.projections} />
          ) : null}
        </section>

        {/* Intervention Intelligence — Deviations + Vulnerability */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-display font-semibold text-rich-black flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Intervention Intelligence
              </h2>
              <p className="text-xs text-dark-gray mt-0.5">
                Identify where CSO interventions are most needed — district-level analysis
              </p>
            </div>
            <div className="flex rounded-lg border border-light-gray overflow-hidden text-xs font-medium">
              <button
                onClick={() => setActiveInsightTab('deviations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  activeInsightTab === 'deviations'
                    ? 'bg-rwanda-blue text-white'
                    : 'bg-white text-dark-gray hover:bg-off-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Deviations
              </button>
              <button
                onClick={() => setActiveInsightTab('vulnerability')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  activeInsightTab === 'vulnerability'
                    ? 'bg-rwanda-blue text-white'
                    : 'bg-white text-dark-gray hover:bg-off-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Vulnerability
              </button>
            </div>
          </div>

          {activeInsightTab === 'deviations' && (
            deviationsLoading ? (
              <div className="h-64 skeleton rounded-xl" />
            ) : deviations ? (
              <DeviationsTable data={deviations} />
            ) : null
          )}

          {activeInsightTab === 'vulnerability' && (
            vulnerabilityLoading ? (
              <div className="h-64 skeleton rounded-xl" />
            ) : vulnerability ? (
              <VulnerabilityScorecard data={vulnerability} />
            ) : null
          )}
        </section>

        {/* Historical population trend */}
        {overview?.history && overview.history.length > 0 && (
          <section>
            <div className="bg-white rounded-xl border border-light-gray p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-rich-black">Historical Population Growth</h3>
                <button
                  onClick={handleExportOverviewCSV}
                  className="text-xs text-rwanda-blue hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-light-gray">
                      <th className="text-left py-2 pr-4 font-semibold text-dark-gray uppercase tracking-wider">Year</th>
                      <th className="text-right py-2 pr-4 font-semibold text-dark-gray uppercase tracking-wider">Total</th>
                      <th className="text-right py-2 pr-4 font-semibold text-dark-gray uppercase tracking-wider">Male</th>
                      <th className="text-right py-2 font-semibold text-dark-gray uppercase tracking-wider">Female</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.history.map(row => (
                      <tr key={row.year} className="border-b border-light-gray hover:bg-off-white transition-colors">
                        <td className="py-2 pr-4 font-mono font-bold text-rwanda-blue">{row.year}</td>
                        <td className="py-2 pr-4 text-right font-mono">{Number(row.total).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-right font-mono text-[#00A1DE]">{Number(row.male).toLocaleString()}</td>
                        <td className="py-2 text-right font-mono text-[#EC4899]">{Number(row.female).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Footer / data source */}
        <div className="text-xs text-medium-gray border-t border-light-gray pt-3 flex items-center justify-between">
          <span>
            Data source: Rwanda National Institute of Statistics (NISR) — Population and Housing Census 2022
          </span>
          <span className="font-mono">PHC5-2022</span>
        </div>
      </div>
    </div>
  );
}
