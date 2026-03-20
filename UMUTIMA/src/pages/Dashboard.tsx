import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalogStats } from '../lib/api';
import { exportToCSV } from '../lib/export';
import { generatePDF } from '../lib/pdfExport';
import RwandaMap from '../components/RwandaMap';
import PdfExportModal from '../components/PdfExportModal';
import GapCtaModal, { type CtaActionType } from '../components/GapCtaModal';
import { useDistricts } from '../context/DistrictContext';
import {
  Sparkles, Download, FileText, Loader2, Globe,
  Database, BookOpen, Star, AlertTriangle, Info, TrendingUp,
  BarChart2, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const DOMAIN_COLORS: Record<string, string> = {
  'Demographic & Health': '#00A1DE',
  'Household Survey':     '#20603D',
  'Labour Force':         '#FAD201',
  'Agricultural':         '#F97316',
  'Census':               '#7C3AED',
  'Financial Inclusion':  '#EC4899',
  'Food Security':        '#14B8A6',
  'Other':                '#94A3B8',
};

const SEVERITY_STYLES = {
  critical: { border: '#DC2626', bg: '#FEF2F2', icon: <AlertTriangle className="w-4 h-4" />, iconColor: '#DC2626' },
  warning:  { border: '#D97706', bg: '#FFFBEB', icon: <AlertTriangle className="w-4 h-4" />, iconColor: '#D97706' },
  info:     { border: '#00A1DE', bg: '#EFF6FF', icon: <Info className="w-4 h-4" />,          iconColor: '#00A1DE' },
};

export default function Dashboard() {
  const [isPdfModalOpen, setIsPdfModalOpen]     = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [aiInsights, setAiInsights]             = useState<{ type: string; headline: string }[]>([]);
  const [activeCtaGap, setActiveCtaGap] = useState<{ gapTitle: string; gapDesc: string; action: CtaActionType; studyId?: string; studyTitle?: string } | null>(null);
  const [expandedGaps, setExpandedGaps] = useState<Set<number>>(new Set());
  const { selectedDistricts } = useDistricts();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['catalog-stats'],
    queryFn: fetchCatalogStats,
  });

  const handleGenerateInsight = async () => {
    if (!stats) return;
    setIsGeneratingInsight(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY not set');
      const ai = new GoogleGenAI({ apiKey });
      const context = `Rwanda NISR microdata catalog: ${stats.totalStudies} studies, ${stats.totalResources} resources, avg quality ${stats.avgQualityScore}/100. Study types: ${stats.studiesByType.slice(0, 4).map(t => `${t.type} (${t.count})`).join(', ')}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Based on this Rwanda gender data repository context: ${context}. What are the latest real-world developments, news, or policy initiatives in Rwanda regarding gender equality, women's empowerment, or data-driven governance? Provide exactly 3 short, distinct insights. Return a JSON array of objects with 'type' (NEWS/POLICY/INITIATIVE) and 'headline'.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '[]');
      setAiInsights(parsed.map((item: any, i: number) => ({ type: item.type || 'INSIGHT', headline: item.headline || item })));
    } catch (e) {
      console.error('Gemini error:', e);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats) return;
    exportToCSV(stats.studiesByType.map(t => ({ 'Study Type': t.type, Count: t.count })), 'GDO_Catalog_Summary');
  };

  const handleExportPDF = async (title: string, date: string, selectedSections: string[]) => {
    const all = ['dashboard-metrics', 'dashboard-chart', 'dashboard-map', 'dashboard-gaps', 'dashboard-insights'];
    await generatePDF('dashboard-content', 'GDO_Dashboard_Report', title, date, all.filter(id => !selectedSections.includes(id)));
  };

  // KPI cards derived from real catalog stats
  const kpis = stats ? [
    {
      label: 'Total Studies',
      value: stats.totalStudies.toString(),
      sub: 'Rwanda microdata catalog',
      icon: <BookOpen className="w-4 h-4" />,
      color: '#00A1DE',
      trend: `${stats.studiesByYear.at(-1)?.count ?? 0} in ${stats.studiesByYear.at(-1)?.year ?? '—'}`,
      trendUp: true,
    },
    {
      label: 'Total Resources',
      value: stats.totalResources.toString(),
      sub: 'PDFs, datasets, reports',
      icon: <Database className="w-4 h-4" />,
      color: '#20603D',
      trend: `avg ${(stats.totalResources / stats.totalStudies).toFixed(1)} per study`,
      trendUp: true,
    },
    {
      label: 'Avg Quality Score',
      value: `${stats.avgQualityScore}`,
      sub: 'out of 100',
      icon: <Star className="w-4 h-4" />,
      color: stats.avgQualityScore >= 80 ? '#16a34a' : stats.avgQualityScore >= 60 ? '#d97706' : '#dc2626',
      trend: stats.avgQualityScore >= 80 ? 'Excellent' : stats.avgQualityScore >= 60 ? 'Good' : 'Needs work',
      trendUp: stats.avgQualityScore >= 70,
    },
    {
      label: 'Data Gaps',
      value: (stats.studiesWithNoResources + stats.studiesWithMissingAbstract).toString(),
      sub: selectedDistricts.length > 0
        ? `across ${selectedDistricts.length} district${selectedDistricts.length !== 1 ? 's' : ''}`
        : 'studies with missing data',
      icon: <AlertCircle className="w-4 h-4" />,
      color: '#DC2626',
      trend: `${stats.studiesWithNoResources} missing resources`,
      trendUp: false,
    },
  ] : [];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-display font-bold text-rich-black">Data Observatory</h1>
          <p className="text-dark-gray text-sm">
            {selectedDistricts.length > 0 ? `${selectedDistricts.length} district${selectedDistricts.length !== 1 ? 's' : ''} selected: ` : 'National overview of '}microdata catalog — {stats ? `${stats.totalStudies} studies` : 'loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPdfModalOpen(true)} className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={isGeneratingInsight || !stats}
            className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs disabled:opacity-70"
          >
            {isGeneratingInsight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isGeneratingInsight ? 'Generating…' : 'AI Insights'}
          </button>
        </div>
      </div>

      <div id="dashboard-content" className="space-y-4">

        {/* KPI Cards */}
        <section id="dashboard-metrics">
          <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Catalog Overview</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-xl border border-light-gray p-6 text-center text-sm text-dark-gray">
              <AlertCircle className="w-6 h-6 text-rwanda-yellow mx-auto mb-2" />
              Could not load catalog stats. Ensure Django is running at localhost:8000.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl border border-light-gray p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: kpi.color }}>{kpi.icon}</span>
                    <span className="text-xs font-semibold text-dark-gray uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-[10px] text-dark-gray">{kpi.sub}</div>
                  <div className="flex items-center gap-1 text-[10px] font-medium mt-auto" style={{ color: kpi.trendUp ? '#16a34a' : '#dc2626' }}>
                    <TrendingUp className="w-3 h-3" />
                    {kpi.trend}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Studies by Type chart + Studies by Year chart */}
        {stats && (
          <section id="dashboard-chart">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By Type */}
              <div className="bg-white rounded-xl border border-light-gray p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-rwanda-blue" />
                  <h3 className="text-sm font-semibold text-rich-black">Studies by Type</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.studiesByType} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} />
                    <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1A1A' }} width={110} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                      cursor={{ fill: '#F7FAFC' }}
                    />
                    <Bar dataKey="count" name="Studies" radius={[0, 4, 4, 0]} barSize={14}>
                      {stats.studiesByType.map((entry) => (
                        <Cell key={entry.type} fill={DOMAIN_COLORS[entry.type] ?? '#94A3B8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Year */}
              <div className="bg-white rounded-xl border border-light-gray p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-rwanda-blue" />
                  <h3 className="text-sm font-semibold text-rich-black">Studies by Year</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.studiesByYear} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                      cursor={{ fill: '#F7FAFC' }}
                    />
                    <Bar dataKey="count" name="Studies" fill="#00A1DE" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Map + Data Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section id="dashboard-map" className="lg:col-span-2">
            <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Coverage Map</h2>
            <div className="h-[500px] rounded-xl overflow-hidden">
              <RwandaMap />
            </div>
          </section>

          <section id="dashboard-gaps" className="space-y-2">
            <h2 className="text-sm font-display font-semibold text-rich-black mb-2">Data Gaps & Alerts</h2>
            {selectedDistricts.length > 0 && (
              <div className="text-xs text-medium-gray bg-off-white border border-light-gray rounded-lg px-3 py-2 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Gap alerts shown are catalog-level. For district-specific analysis, see the Gap Analysis page.
              </div>
            )}
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)
            ) : stats?.dataGaps.length ? (
              stats.dataGaps.map((gap, i) => {
                const s = SEVERITY_STYLES[gap.severity];
                const isExpanded = expandedGaps.has(i);
                const affectedStudies = (gap as any).affectedStudies || [];
                const toggleExpanded = () => {
                  const newSet = new Set(expandedGaps);
                  if (newSet.has(i)) {
                    newSet.delete(i);
                  } else {
                    newSet.add(i);
                  }
                  setExpandedGaps(newSet);
                };
                return (
                  <div key={i} className="bg-white rounded-xl border border-light-gray overflow-hidden">
                    <div className="border-l-4 p-3 flex items-start gap-3 flex-col sm:flex-row sm:items-start" style={{ borderLeftColor: s.border }}>
                      <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                        <span className="mt-0.5 shrink-0" style={{ color: s.iconColor }}>{s.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-rich-black leading-snug">{gap.title}</p>
                          <p className="text-xs text-dark-gray mt-0.5 leading-relaxed">{gap.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleExpanded}
                        className="text-medium-gray hover:text-dark-gray shrink-0 -mt-1 sm:-mt-3"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-light-gray p-3 space-y-3 bg-off-white">
                        {affectedStudies && affectedStudies.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-dark-gray uppercase tracking-wider mb-2">Affected Studies ({affectedStudies.length})</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {affectedStudies.map((study: any, idx: number) => (
                                <div key={idx} className="text-xs bg-white rounded p-2 border border-light-gray">
                                  <p className="font-medium text-rich-black line-clamp-1">{study.title}</p>
                                  <p className="text-[10px] text-dark-gray">{study.organization} • {study.year}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-light-gray">
                          <button
                            onClick={() => setActiveCtaGap({ gapTitle: gap.title, gapDesc: gap.description, action: 'submit' })}
                            className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            📤 Submit Data
                          </button>
                          <button
                            onClick={() => setActiveCtaGap({ gapTitle: gap.title, gapDesc: gap.description, action: 'correct' })}
                            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            ✏️ Correct
                          </button>
                          <button
                            onClick={() => setActiveCtaGap({ gapTitle: gap.title, gapDesc: gap.description, action: 'request' })}
                            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            🔄 Request Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-light-gray p-4 text-center text-sm text-dark-gray">
                No data gaps detected.
              </div>
            )}

            {/* Recent studies mini-list */}
            {stats && stats.recentStudies.length > 0 && (
              <div className="bg-white rounded-xl border border-light-gray p-3 mt-2">
                <h3 className="text-xs font-semibold text-rich-black mb-2 uppercase tracking-wider">Recent Studies</h3>
                <div className="space-y-2">
                  {stats.recentStudies.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-start gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-off-white border border-light-gray text-dark-gray shrink-0 mt-0.5">
                        {s.year}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-rich-black line-clamp-1 leading-snug">{s.title}</p>
                        <p className="text-[10px] text-dark-gray truncate">{s.organization.split(' - ')[0]}</p>
                      </div>
                      <span className="text-[10px] font-bold shrink-0 ml-auto" style={{
                        color: s.quality_score >= 80 ? '#16a34a' : s.quality_score >= 60 ? '#d97706' : '#dc2626'
                      }}>
                        {s.quality_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* AI Insights / Recent Studies full panel */}
        <section id="dashboard-insights">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-rwanda-blue" />
            <h2 className="text-sm font-display font-semibold text-rich-black">
              {aiInsights.length > 0 ? 'AI-Generated Insights' : 'Latest Catalog Additions'}
            </h2>
            {aiInsights.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-rwanda-blue/10 text-rwanda-blue text-xs font-medium rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" /> Live Search
              </span>
            )}
          </div>

          {isGeneratingInsight ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          ) : aiInsights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-light-gray shadow-sm hover:border-rwanda-blue transition-colors">
                  <span className="inline-block px-2 py-0.5 bg-off-white text-xs font-bold text-dark-gray rounded mb-2 uppercase tracking-wider">
                    {insight.type}
                  </span>
                  <p className="text-rich-black text-sm font-medium leading-relaxed">{insight.headline}</p>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.recentStudies.map(s => (
                <div key={s.id} className="bg-white p-3 rounded-xl border border-light-gray hover:border-rwanda-blue transition-colors group">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-off-white border border-light-gray text-dark-gray">
                      {s.year}
                    </span>
                    <span className="text-[10px] font-bold" style={{
                      color: s.quality_score >= 80 ? '#16a34a' : s.quality_score >= 60 ? '#d97706' : '#dc2626'
                    }}>
                      Q: {s.quality_score}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-rich-black line-clamp-2 leading-snug group-hover:text-rwanda-blue transition-colors">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-dark-gray mt-1 truncate">{s.organization.split(' - ')[0]}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-dark-gray">
                    <span>{s.resource_count} resource{s.resource_count !== 1 ? 's' : ''}</span>
                    <span className="px-1.5 py-0.5 rounded bg-off-white border border-light-gray capitalize">{s.quality_rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          )}
        </section>
      </div>

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExportPDF}
        defaultTitle="DD Rw PORTAL — Data Observatory"
        sections={[
          { id: 'dashboard-metrics',  label: 'Catalog Overview' },
          { id: 'dashboard-chart',    label: 'Study Charts' },
          { id: 'dashboard-map',      label: 'Coverage Map' },
          { id: 'dashboard-gaps',     label: 'Data Gaps & Alerts' },
          { id: 'dashboard-insights', label: 'Recent Studies / AI Insights' },
        ]}
      />

      {activeCtaGap && (
        <GapCtaModal
          isOpen={!!activeCtaGap}
          onClose={() => setActiveCtaGap(null)}
          gapTitle={activeCtaGap.gapTitle}
          gapDescription={activeCtaGap.gapDesc}
          actionType={activeCtaGap.action}
          affectedStudyId={activeCtaGap.studyId}
          affectedStudyTitle={activeCtaGap.studyTitle}
        />
      )}
    </div>
  );
}
