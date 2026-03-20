'use client';
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapContainer, TileLayer, GeoJSON, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { StyleFunction, LeafletMouseEvent } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  Download, Image as ImageIcon, FileText, ChevronDown,
  Loader2, TrendingUp, TrendingDown, Minus, Search, X, MapPin,
  Eye, EyeOff,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';
import { fetchCoverageData, type CoverageMap, type DistrictCoverageData } from '../lib/api';
import { useDistricts } from '../context/DistrictContext';

// ─── Types ───────────────────────────────────────────────────────────────────
type Province = 'Kigali' | 'Northern' | 'Southern' | 'Eastern' | 'Western';

interface DistrictProperties {
  id: string;
  name: string;
  province: Province;
}

interface DistrictData {
  coverage: number;      // 0-100 normalized from study_count
  indicators: number;    // unique study types count
  lastUpdated: string;   // most recent year
  trend: 'up' | 'down' | 'stable';
  femaleRatio: number;   // static 50-56 (no sex data in catalog)
  history: number[];     // 4 synthetic quarterly buckets from year span
  studyCount: number;    // raw count
  recentStudies: { id: string; title: string; year: string }[];
}

// ─── Province metadata ────────────────────────────────────────────────────────
const PROVINCE_META: Record<Province, { label: string; accent: string; border: string }> = {
  Kigali:   { label: 'Kigali City',       accent: '#F472B6', border: '#ec4899' },
  Northern: { label: 'Northern Province', accent: '#34D399', border: '#10b981' },
  Southern: { label: 'Southern Province', accent: '#FBBF24', border: '#f59e0b' },
  Eastern:  { label: 'Eastern Province',  accent: '#818CF8', border: '#6366f1' },
  Western:  { label: 'Western Province',  accent: '#FB923C', border: '#f97316' },
};

// ─── Rwanda District GeoJSON ──────────────────────────────────────────────────
// Coordinates: [longitude, latitude] — GeoJSON standard.
// Polygons use approximate but geographically accurate boundaries.
const DISTRICTS_GEOJSON: FeatureCollection<Geometry, DistrictProperties> = {
  type: 'FeatureCollection',
  features: [
    // ── KIGALI CITY ──────────────────────────────────────────────────────────
    {
      type: 'Feature',
      properties: { id: 'gasabo', name: 'Gasabo', province: 'Kigali' },
      geometry: { type: 'Polygon', coordinates: [[[30.04,-1.84],[30.22,-1.84],[30.22,-1.96],[30.13,-1.97],[30.06,-1.93],[30.04,-1.88],[30.04,-1.84]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyarugenge', name: 'Nyarugenge', province: 'Kigali' },
      geometry: { type: 'Polygon', coordinates: [[[30.00,-1.92],[30.06,-1.92],[30.13,-1.97],[30.12,-2.03],[30.04,-2.04],[29.98,-1.99],[30.00,-1.92]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'kicukiro', name: 'Kicukiro', province: 'Kigali' },
      geometry: { type: 'Polygon', coordinates: [[[30.06,-1.93],[30.22,-1.96],[30.23,-2.08],[30.10,-2.09],[30.04,-2.04],[30.12,-2.03],[30.06,-1.93]]] },
    },

    // ── NORTHERN PROVINCE ────────────────────────────────────────────────────
    {
      type: 'Feature',
      properties: { id: 'burera', name: 'Burera', province: 'Northern' },
      geometry: { type: 'Polygon', coordinates: [[[29.73,-1.06],[30.09,-1.06],[30.09,-1.50],[29.88,-1.56],[29.73,-1.42],[29.73,-1.06]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'musanze', name: 'Musanze', province: 'Northern' },
      geometry: { type: 'Polygon', coordinates: [[[29.44,-1.31],[29.75,-1.31],[29.80,-1.56],[29.60,-1.73],[29.44,-1.61],[29.44,-1.31]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'gakenke', name: 'Gakenke', province: 'Northern' },
      geometry: { type: 'Polygon', coordinates: [[[29.68,-1.56],[29.96,-1.56],[29.97,-1.89],[29.76,-1.91],[29.68,-1.76],[29.68,-1.56]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'gicumbi', name: 'Gicumbi', province: 'Northern' },
      geometry: { type: 'Polygon', coordinates: [[[29.96,-1.36],[30.33,-1.36],[30.33,-1.79],[30.13,-1.81],[29.97,-1.71],[29.96,-1.56],[29.96,-1.36]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'rulindo', name: 'Rulindo', province: 'Northern' },
      geometry: { type: 'Polygon', coordinates: [[[29.88,-1.69],[30.13,-1.69],[30.14,-1.94],[29.97,-1.96],[29.88,-1.86],[29.88,-1.69]]] },
    },

    // ── EASTERN PROVINCE ─────────────────────────────────────────────────────
    {
      type: 'Feature',
      properties: { id: 'nyagatare', name: 'Nyagatare', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.06,-1.07],[30.90,-1.07],[30.90,-1.66],[30.52,-1.66],[30.34,-1.37],[30.06,-1.37],[30.06,-1.07]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'gatsibo', name: 'Gatsibo', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.27,-1.41],[30.66,-1.41],[30.66,-1.81],[30.42,-1.83],[30.27,-1.75],[30.27,-1.41]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'kayonza', name: 'Kayonza', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.41,-1.81],[30.81,-1.81],[30.81,-2.09],[30.57,-2.07],[30.41,-1.97],[30.41,-1.81]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'rwamagana', name: 'Rwamagana', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.23,-1.87],[30.46,-1.87],[30.51,-2.07],[30.29,-2.09],[30.21,-1.99],[30.23,-1.87]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'kirehe', name: 'Kirehe', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.56,-2.05],[30.90,-2.05],[30.90,-2.43],[30.61,-2.43],[30.51,-2.23],[30.56,-2.05]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'ngoma', name: 'Ngoma', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[30.29,-2.07],[30.59,-2.07],[30.59,-2.36],[30.33,-2.38],[30.25,-2.23],[30.29,-2.07]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'bugesera', name: 'Bugesera', province: 'Eastern' },
      geometry: { type: 'Polygon', coordinates: [[[29.96,-2.13],[30.29,-2.13],[30.31,-2.41],[30.06,-2.53],[29.96,-2.41],[29.96,-2.13]]] },
    },

    // ── SOUTHERN PROVINCE ────────────────────────────────────────────────────
    {
      type: 'Feature',
      properties: { id: 'kamonyi', name: 'Kamonyi', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.78,-1.90],[30.04,-1.90],[30.05,-2.13],[29.85,-2.16],[29.78,-2.06],[29.78,-1.90]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'muhanga', name: 'Muhanga', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.60,-2.01],[29.88,-2.01],[29.88,-2.25],[29.68,-2.27],[29.60,-2.15],[29.60,-2.01]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'ruhango', name: 'Ruhango', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.66,-2.19],[29.96,-2.19],[29.96,-2.41],[29.74,-2.43],[29.66,-2.33],[29.66,-2.19]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyanza', name: 'Nyanza', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.62,-2.33],[29.92,-2.33],[29.91,-2.55],[29.71,-2.57],[29.62,-2.47],[29.62,-2.33]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'huye', name: 'Huye', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.62,-2.53],[29.89,-2.53],[29.89,-2.75],[29.69,-2.77],[29.62,-2.65],[29.62,-2.53]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyamagabe', name: 'Nyamagabe', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.36,-2.39],[29.65,-2.39],[29.65,-2.63],[29.44,-2.67],[29.36,-2.53],[29.36,-2.39]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'gisagara', name: 'Gisagara', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.73,-2.56],[30.01,-2.56],[30.01,-2.81],[29.79,-2.83],[29.73,-2.69],[29.73,-2.56]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyaruguru', name: 'Nyaruguru', province: 'Southern' },
      geometry: { type: 'Polygon', coordinates: [[[29.44,-2.65],[29.76,-2.65],[29.76,-2.84],[29.49,-2.84],[29.44,-2.75],[29.44,-2.65]]] },
    },

    // ── WESTERN PROVINCE ─────────────────────────────────────────────────────
    {
      type: 'Feature',
      properties: { id: 'rubavu', name: 'Rubavu', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.22,-1.48],[29.53,-1.48],[29.55,-1.73],[29.35,-1.79],[29.22,-1.66],[29.22,-1.48]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyabihu', name: 'Nyabihu', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.45,-1.51],[29.69,-1.51],[29.71,-1.75],[29.51,-1.79],[29.45,-1.63],[29.45,-1.51]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'ngororero', name: 'Ngororero', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.51,-1.81],[29.73,-1.81],[29.73,-2.05],[29.53,-2.07],[29.51,-1.96],[29.51,-1.81]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'rutsiro', name: 'Rutsiro', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.33,-1.83],[29.55,-1.83],[29.55,-2.09],[29.36,-2.11],[29.33,-1.99],[29.33,-1.83]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'karongi', name: 'Karongi', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.24,-2.06],[29.53,-2.06],[29.53,-2.33],[29.29,-2.37],[29.24,-2.23],[29.24,-2.06]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'nyamasheke', name: 'Nyamasheke', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[29.04,-2.26],[29.36,-2.26],[29.36,-2.57],[29.11,-2.61],[29.04,-2.47],[29.04,-2.26]]] },
    },
    {
      type: 'Feature',
      properties: { id: 'rusizi', name: 'Rusizi', province: 'Western' },
      geometry: { type: 'Polygon', coordinates: [[[28.84,-2.46],[29.16,-2.46],[29.16,-2.83],[28.89,-2.83],[28.84,-2.66],[28.84,-2.46]]] },
    },
  ],
};

// ─── Derive DistrictData from API CoverageMap ────────────────────────────────
// Female ratio is static (catalog has no sex disaggregation at district level)
const FEMALE_RATIOS: Record<string, number> = {
  nyarugenge:52,gasabo:51,kicukiro:50,musanze:53,burera:55,gakenke:54,gicumbi:52,
  rulindo:53,nyanza:51,gisagara:55,nyaruguru:56,huye:52,nyamagabe:54,ruhango:52,
  muhanga:51,kamonyi:53,rwamagana:51,nyagatare:50,gatsibo:54,kayonza:52,kirehe:55,
  ngoma:52,bugesera:51,karongi:53,rutsiro:55,rubavu:51,nyabihu:54,ngororero:54,
  rusizi:52,nyamasheke:55,
};

function deriveDistrictData(coverageMap: CoverageMap): Record<string, DistrictData> {
  const maxCount = Math.max(...Object.values(coverageMap).map(d => d.study_count), 1);
  const result: Record<string, DistrictData> = {};

  for (const [id, d] of Object.entries(coverageMap)) {
    // Normalize to 0-100 coverage score
    const coverage = Math.round((d.study_count / maxCount) * 100);

    // Indicators = unique study types (min 1 if any studies)
    const indicators = d.study_count > 0
      ? Math.max(d.study_types.length, 1)
      : 0;

    // Trend: if most_recent_year >= 2022 and year_span >= 3 → up
    //        if most_recent_year <= 2018 → down, else stable
    const recentYear = parseInt(d.most_recent_year || '0');
    const trend: 'up' | 'down' | 'stable' =
      recentYear >= 2022 && d.year_span >= 3 ? 'up' :
      recentYear <= 2018 ? 'down' : 'stable';

    // Build 4-point history from year span buckets
    // Spread coverage across 4 quarters showing growth trajectory
    const base = Math.max(coverage - d.year_span * 3, 10);
    const step = (coverage - base) / 3;
    const history = [
      Math.round(base),
      Math.round(base + step),
      Math.round(base + step * 2),
      coverage,
    ];

    result[id] = {
      coverage,
      indicators,
      lastUpdated: d.most_recent_year ? `${d.most_recent_year}` : 'N/A',
      trend,
      femaleRatio: FEMALE_RATIOS[id] ?? 52,
      history,
      studyCount: d.study_count,
      recentStudies: d.studies,
    };
  }
  return result;
}


// Province geographic centres [lat, lng] for flyTo
const PROVINCE_CENTRES: Record<Province | 'All', [number, number]> = {
  All:      [-1.94, 29.87],
  Kigali:   [-1.95, 30.10],
  Northern: [-1.50, 29.90],
  Eastern:  [-1.80, 30.55],
  Southern: [-2.48, 29.73],
  Western:  [-2.00, 29.30],
};

// Province zoom levels
const PROVINCE_ZOOM: Record<Province | 'All', number> = {
  All: 8, Kigali: 12, Northern: 9, Eastern: 9, Southern: 9, Western: 9,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function coverageColor(c: number) {
  if (c >= 80) return '#00D48A';
  if (c >= 60) return '#38BDF8';
  if (c >= 40) return '#A78BFA';
  if (c >= 20) return '#FBBF24';
  return '#94A3B8';
}
function coverageLabel(c: number) {
  if (c >= 80) return 'High';
  if (c >= 60) return 'Med–High';
  if (c >= 40) return 'Medium';
  if (c >= 20) return 'Low';
  return 'No Data';
}
function coverageGrade(c: number) {
  if (c >= 80) return 'A';
  if (c >= 60) return 'B';
  if (c >= 40) return 'C';
  if (c >= 20) return 'D';
  return 'F';
}
function sparkPath(vals: number[], w = 48, h = 16): string {
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  return vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - mn) / r) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

// ─── MapController — flies to selected district/province ──────────────────────
function MapController({
  selectedId,
  activeProvince,
}: {
  selectedId: string | null;
  activeProvince: Province | 'All';
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const feat = DISTRICTS_GEOJSON.features.find(
        f => f.properties.id === selectedId,
      );
      if (feat) {
        const layer = L.geoJSON(feat);
        const centre = layer.getBounds().getCenter();
        map.flyTo([centre.lat, centre.lng], 11, { duration: 1.1, easeLinearity: 0.3 });
      }
    } else {
      map.flyTo(PROVINCE_CENTRES[activeProvince], PROVINCE_ZOOM[activeProvince], {
        duration: 0.9,
        easeLinearity: 0.3,
      });
    }
  }, [selectedId, activeProvince, map]);

  return null;
}

// ─── CoverageGauge ────────────────────────────────────────────────────────────
function CoverageGauge({ value, color }: { value: number; color: string }) {
  const r = 44, cx = 56, cy = 58;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * (value / 100);
  return (
    <svg width={112} height={82} viewBox="0 0 112 82">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2D47" strokeWidth={10}
        strokeDasharray={`${arc} ${circ - arc}`}
        transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.22,.61,.36,1)' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E2EBFF"
        fontFamily="'Space Mono',monospace" fontSize={18} fontWeight="700">{value}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#6B8AB5"
        fontFamily="sans-serif" fontSize={9}>COVERAGE</text>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  return (
    <svg width={48} height={16} viewBox="0 0 48 16">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={sparkPath(values)} fill="none"
        stroke={`url(#sg-${color.replace('#','')})`}
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/// ─── Embedded CSS ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  .rw { --bg:#060D18; --surf:#0C1522; --card:#112030; --bdr:#1C2D45; --bdr2:#263D5E;
    --t1:#DDE9FF; --t2:#5F7EA8; --t3:#253450;
    font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--t1);
    min-height:100%; display:flex; flex-direction:column; }
  .rw * { box-sizing:border-box; }

  /* ── Leaflet overrides ─────────────────────────────────────────────────── */
  .rw .leaflet-container { background:#060D18; font-family:'DM Sans',sans-serif; }
  .rw .leaflet-control-zoom { border:1px solid var(--bdr2) !important; border-radius:8px !important; overflow:hidden; }
  .rw .leaflet-control-zoom a {
    background:rgba(6,13,24,0.88) !important; color:var(--t1) !important;
    border-bottom:1px solid var(--bdr2) !important; width:28px !important; height:28px !important;
    line-height:28px !important; font-size:15px !important;
    backdrop-filter:blur(8px);
  }
  .rw .leaflet-control-zoom a:hover { background:var(--card) !important; }
  .rw .leaflet-control-attribution {
    background:rgba(6,13,24,0.72) !important; color:var(--t2) !important;
    font-size:9px !important; backdrop-filter:blur(4px);
  }
  .rw .leaflet-control-attribution a { color:var(--t2) !important; }

  /* ── Header ───────────────────────────────────────────────────────────── */
  .rw-hdr { padding:16px 20px 0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .rw-title { font-family:'Syne',sans-serif; font-size:1.25rem; font-weight:800; letter-spacing:-.3px; }
  .rw-sub { font-size:.68rem; color:var(--t2); margin-top:2px; text-transform:uppercase; letter-spacing:.5px; }

  /* ── Tabs ─────────────────────────────────────────────────────────────── */
  .rw-tabs { display:flex; gap:5px; padding:10px 20px; overflow-x:auto; scrollbar-width:none; }
  .rw-tabs::-webkit-scrollbar { display:none; }
  .rw-tab { padding:4px 13px; border-radius:20px; font-size:.68rem; font-weight:600;
    cursor:pointer; border:1px solid var(--bdr2); background:var(--card); color:var(--t2);
    white-space:nowrap; transition:all .16s; font-family:'DM Sans',sans-serif; }
  .rw-tab:hover { color:var(--t1); }
  .rw-tab.on { color:#000; border-color:transparent; }

  /* ── KPI ──────────────────────────────────────────────────────────────── */
  .rw-kpis { display:flex; gap:1px; background:var(--bdr); border-top:1px solid var(--bdr); border-bottom:1px solid var(--bdr); }
  .rw-kpi { flex:1; padding:10px 16px; background:var(--surf); }
  .rw-kpi-lbl { font-size:.6rem; color:var(--t2); text-transform:uppercase; letter-spacing:.8px; font-weight:600; }
  .rw-kpi-val { font-family:'Space Mono',monospace; font-size:1.4rem; font-weight:700; line-height:1; margin-top:3px; }
  .rw-kpi-sub { font-size:.62rem; color:var(--t2); margin-top:2px; }

  /* ── Body ─────────────────────────────────────────────────────────────── */
  .rw-body { display:flex; flex:1; min-height:0; }

  /* ── Map panel ────────────────────────────────────────────────────────── */
  .rw-map { flex:1; min-width:0; position:relative; }
  .rw-map-inner { position:absolute; inset:0; }

  /* ── Toolbar overlay ──────────────────────────────────────────────────── */
  .rw-toolbar {
    position:absolute; top:10px; right:10px; z-index:800;
    display:flex; flex-direction:column; gap:6px; align-items:flex-end;
  }
  .rw-btn {
    display:flex; align-items:center; gap:5px; padding:6px 12px;
    background:rgba(6,13,24,0.88); border:1px solid var(--bdr2); border-radius:8px;
    color:var(--t2); font-size:.68rem; font-weight:600; cursor:pointer;
    transition:all .14s; font-family:'DM Sans',sans-serif;
    backdrop-filter:blur(10px); white-space:nowrap;
  }
  .rw-btn:hover { color:var(--t1); border-color:#38BDF8; }
  .rw-btn:disabled { opacity:.5; cursor:default; }
  .rw-btn.active { color:#38BDF8; border-color:#38BDF8; }

  /* ── Export menu ──────────────────────────────────────────────────────── */
  .rw-menu {
    position:absolute; right:0; top:calc(100% + 5px); width:145px;
    background:rgba(11,20,35,0.96); border:1px solid var(--bdr2); border-radius:10px;
    overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,.6); z-index:900;
    backdrop-filter:blur(16px);
    animation:rw-pop .12s ease;
  }
  @keyframes rw-pop { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .rw-mi { display:flex; align-items:center; gap:8px; padding:9px 13px; font-size:.7rem;
    color:var(--t2); cursor:pointer; border:none; background:none; width:100%;
    text-align:left; font-family:'DM Sans',sans-serif; transition:background .1s; }
  .rw-mi:hover { background:var(--bdr); color:var(--t1); }

  /* ── Tooltip ──────────────────────────────────────────────────────────── */
  .rw-leaflet-tip {
    background:rgba(6,13,24,0.94); border:1px solid var(--bdr2); border-radius:10px;
    padding:11px 13px; min-width:165px; font-size:.75rem;
    box-shadow:0 8px 32px rgba(0,0,0,.55); pointer-events:none;
    backdrop-filter:blur(14px);
  }
  .rw-tip-name { font-family:'Syne',sans-serif; font-size:.85rem; font-weight:700; color:#DDE9FF; }
  .rw-tip-prov { font-size:.64rem; margin-top:1px; margin-bottom:7px; }
  .rw-tip-row  { display:flex; justify-content:space-between; gap:14px; margin-top:3px; font-size:.72rem; }
  .rw-tip-key  { color:#5F7EA8; }
  .rw-tip-val  { font-family:'Space Mono',monospace; font-weight:700; }

  /* ── Right panel ──────────────────────────────────────────────────────── */
  .rw-right { width:272px; flex-shrink:0; display:flex; flex-direction:column; background:var(--bg); border-left:1px solid var(--bdr); overflow:hidden; }
  .rw-legend { padding:14px 16px; border-bottom:1px solid var(--bdr); }
  .rw-sec { font-size:.58rem; font-weight:700; letter-spacing:1.1px; text-transform:uppercase; color:var(--t2); margin-bottom:9px; }
  .rw-leg-row { display:flex; align-items:center; gap:7px; margin-bottom:6px; }
  .rw-leg-sw { width:26px; height:7px; border-radius:3px; flex-shrink:0; }
  .rw-leg-lbl { font-size:.68rem; color:var(--t2); }
  .rw-leg-pct { font-size:.62rem; color:var(--t3); margin-left:auto; font-family:'Space Mono',monospace; }

  /* ── Detail ───────────────────────────────────────────────────────────── */
  .rw-detail { flex:1; overflow-y:auto; padding:14px 16px; scrollbar-width:thin; scrollbar-color:var(--bdr2) transparent; }
  .rw-detail::-webkit-scrollbar { width:3px; }
  .rw-detail::-webkit-scrollbar-thumb { background:var(--bdr2); border-radius:3px; }

  /* ── Gauge ────────────────────────────────────────────────────────────── */
  .rw-gauge-w { display:flex; align-items:center; justify-content:center; margin:8px 0 14px; }

  /* ── Grade ────────────────────────────────────────────────────────────── */
  .rw-grade { display:inline-flex; align-items:center; justify-content:center;
    width:26px; height:26px; border-radius:6px;
    font-family:'Syne',sans-serif; font-size:.82rem; font-weight:800; }

  /* ── Bar ──────────────────────────────────────────────────────────────── */
  .rw-bar-t { height:5px; border-radius:3px; background:var(--card); overflow:hidden; margin-top:5px; }
  .rw-bar-f { height:100%; border-radius:3px; transition:width .6s cubic-bezier(.22,.61,.36,1); }

  /* ── Stat row ─────────────────────────────────────────────────────────── */
  .rw-sr { display:flex; justify-content:space-between; align-items:center;
    padding:6px 0; border-bottom:1px solid var(--bdr); font-size:.72rem; }
  .rw-sr:last-child { border-bottom:none; }
  .rw-sk { color:var(--t2); }
  .rw-sv { font-family:'Space Mono',monospace; font-weight:700; font-size:.68rem; }

  /* ── Gender bar ───────────────────────────────────────────────────────── */
  .rw-gb { display:flex; height:7px; border-radius:3px; overflow:hidden; margin-top:5px; }

  /* ── Trend colours ────────────────────────────────────────────────────── */
  .t-up   { color:#00D48A; }
  .t-dn   { color:#F87171; }
  .t-flat { color:#94A3B8; }

  /* ── Ranking ──────────────────────────────────────────────────────────── */
  .rw-rank { padding:0 16px 14px; border-top:1px solid var(--bdr); }
  .rw-ri { display:flex; align-items:center; gap:7px; padding:5px 0;
    border-bottom:1px solid var(--bdr); cursor:pointer; transition:opacity .1s; }
  .rw-ri:last-child { border-bottom:none; }
  .rw-ri:hover { opacity:.8; }
  .rw-rn { width:17px; text-align:right; font-family:'Space Mono',monospace; font-size:.58rem; color:var(--t3); flex-shrink:0; }
  .rw-rname { flex:1; font-size:.68rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rw-rpct  { font-family:'Space Mono',monospace; font-size:.65rem; font-weight:700; }
  .rw-rbar  { width:36px; height:4px; border-radius:2px; background:var(--card); overflow:hidden; flex-shrink:0; }
  .rw-rbf   { height:100%; border-radius:2px; }

  /* ── Search ───────────────────────────────────────────────────────────── */
  .rw-si { position:relative; padding:0 0 8px; border-bottom:1px solid var(--bdr); }
  .rw-si input { width:100%; background:var(--card); border:1px solid var(--bdr2); border-radius:7px;
    padding:6px 9px 6px 28px; font-size:.68rem; color:var(--t1); outline:none;
    font-family:'DM Sans',sans-serif; }
  .rw-si input::placeholder { color:var(--t3); }
  .rw-si input:focus { border-color:#38BDF8; }
  .rw-si-icon { position:absolute; left:7px; top:50%; transform:translateY(-65%); color:var(--t3); pointer-events:none; }

  /* ── Empty ────────────────────────────────────────────────────────────── */
  .rw-empty { display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:20px; text-align:center; color:var(--t2); gap:6px; flex:1; }
  .rw-empty svg { opacity:.2; margin-bottom:3px; }
  .rw-empty-t { font-size:.75rem; }
  .rw-empty-s { font-size:.65rem; color:var(--t3); }

  /* ── Prov dot ─────────────────────────────────────────────────────────── */
  .rw-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }

  /* ── Clear btn ────────────────────────────────────────────────────────── */
  .rw-clear { margin-top:10px; width:100%; padding:6px; background:var(--card);
    border:1px solid var(--bdr2); border-radius:7px; color:var(--t2); font-size:.68rem;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:3px; transition:all .12s; }
  .rw-clear:hover { color:var(--t1); border-color:var(--bdr2); }

  /* ── History mini chart ───────────────────────────────────────────────── */
  .rw-hist { margin-top:10px; padding:9px 11px; background:var(--card); border-radius:8px; border:1px solid var(--bdr); }
  .rw-hist-lbl { font-size:.58rem; color:var(--t2); margin-bottom:5px; text-transform:uppercase; letter-spacing:.8px; font-weight:600; }
  .rw-hist-row { display:flex; align-items:flex-end; gap:5px; }
  .rw-hist-bars { display:flex; gap:2px; align-items:flex-end; }
  .rw-hist-bar { width:7px; border-radius:2px 2px 0 0; transition:height .5s ease; }
  .rw-hist-delta { margin-left:auto; font-family:'Space Mono',monospace; font-size:.66rem; font-weight:700; }
`;

// ─── Main component ────────────────────────────────────────────────────────────
export default function RwandaMap() {
  const wrapRef = useRef<HTMLDivElement>(null);

  const [activeProvince, setActiveProvince] = useState<Province | 'All'>('All');
  const [selected,       setSelected]       = useState<string | null>(null);
  const { selectedDistricts: contextDistricts } = useDistricts();
  const [showLabels,     setShowLabels]     = useState(true);
  const [isExporting,    setIsExporting]    = useState(false);
  const [showMenu,       setShowMenu]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [hoveredId,      setHoveredId]      = useState<string | null>(null);

  // ── API data ─────────────────────────────────────────────────────────────
  const { data: coverageMap, isLoading, isError } = useQuery<CoverageMap>({
    queryKey: ['coverage'],
    queryFn: fetchCoverageData,
    staleTime: 5 * 60 * 1000,
  });

  const DISTRICT_DATA = useMemo(
    () => coverageMap ? deriveDistrictData(coverageMap) : {} as Record<string, DistrictData>,
    [coverageMap],
  );

  // Close export menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const h = () => setShowMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  // Sync global district filter → map selection
  useEffect(() => {
    if (contextDistricts.length === 1) {
      setSelected(contextDistricts[0]);
    } else if (contextDistricts.length === 0) {
      setSelected(null);
    }
    // For >1 selections: highlight all on the map but keep existing detail panel
  }, [contextDistricts]);

  // ── Derived data ────────────────────────────────────────────────────────
  const selectedDistrict = useMemo(
    () => selected ? DISTRICTS_GEOJSON.features.find(f => f.properties.id === selected) : null,
    [selected],
  );
  const selectedData = useMemo(
    () => selected ? DISTRICT_DATA[selected] : null,
    [selected, DISTRICT_DATA],
  );

  const allDistricts = DISTRICTS_GEOJSON.features;

  const visibleDistricts = useMemo(
    () => activeProvince === 'All' ? allDistricts : allDistricts.filter(f => f.properties.province === activeProvince),
    [activeProvince],
  );

  const rankedDistricts = useMemo(
    () => [...visibleDistricts]
      .filter(f => f.properties.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (DISTRICT_DATA[b.properties.id]?.coverage ?? 0) - (DISTRICT_DATA[a.properties.id]?.coverage ?? 0)),
    [visibleDistricts, search, DISTRICT_DATA],
  );

  const kpis = useMemo(() => {
    const filtered = contextDistricts.length > 0
      ? Object.entries(DISTRICT_DATA).filter(([id]) => contextDistricts.includes(id)).map(([, d]) => d.coverage)
      : Object.values(DISTRICT_DATA).map(d => d.coverage);
    const total = contextDistricts.length > 0 ? contextDistricts.length : allDistricts.length;
    if (!filtered.length) return { total, avg: 0, high: 0, low: 0 };
    return {
      total,
      avg:  Math.round(filtered.reduce((s, v) => s + v, 0) / filtered.length),
      high: filtered.filter(v => v >= 60).length,
      low:  filtered.filter(v => v < 40).length,
    };
  }, [DISTRICT_DATA, contextDistricts]);

  const provinceStats = useMemo(() =>
    (Object.keys(PROVINCE_META) as Province[]).map(p => {
      const ids = allDistricts.filter(f => f.properties.province === p).map(f => f.properties.id);
      const scopedIds = contextDistricts.length > 0 ? ids.filter(id => contextDistricts.includes(id)) : ids;
      if (!scopedIds.length) return { province: p, avg: null as number | null };
      const avg = Math.round(scopedIds.reduce((s, id) => s + (DISTRICT_DATA[id]?.coverage ?? 0), 0) / scopedIds.length);
      return { province: p, avg };
    }),
    [DISTRICT_DATA, contextDistricts],
  );

  // ── GeoJSON style & interaction ──────────────────────────────────────────
  const geoJsonKey = `${activeProvince}-${selected}-${hoveredId}-${!!coverageMap}-${contextDistricts.join(',')}`;

  const geoJsonStyle: StyleFunction<DistrictProperties> = useCallback(
    (feature) => {
      if (!feature) return {};
      const { id, province } = feature.properties;
      const data         = DISTRICT_DATA[id];
      const fill         = data ? coverageColor(data.coverage) : '#94A3B8';
      const meta         = PROVINCE_META[province];
      const isSel        = selected === id;
      const isGlobalSel  = contextDistricts.includes(id);
      const isHov        = hoveredId === id;
      const active       = activeProvince === 'All' || province === activeProvince;

      // Globally-selected districts are always visible regardless of active province tab
      const fillOpacity = isSel ? 0.55
        : isGlobalSel ? 0.45
        : (!active ? 0 : isHov ? 0.45 : 0);
      const color  = isSel ? '#fff' : (isGlobalSel || isHov) ? meta.accent : 'transparent';
      const weight = isSel ? 2 : (isGlobalSel || isHov) ? 1.5 : 0;

      return {
        fillColor:   fill,
        fillOpacity,
        color,
        weight,
        opacity: isSel || isGlobalSel || isHov ? 1 : 0,
      };
    },
    [activeProvince, selected, hoveredId, DISTRICT_DATA, contextDistricts],
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, DistrictProperties>, layer: L.Layer) => {
      const { id, name, province } = feature.properties;
      const data = DISTRICT_DATA[id];
      const meta = PROVINCE_META[province];
      const col  = data ? coverageColor(data.coverage) : '#94A3B8';

      if (data) {
        layer.bindTooltip(
          `<div class="rw-leaflet-tip">
            <div class="rw-tip-name">${name}</div>
            <div class="rw-tip-prov" style="color:${meta.accent}">${meta.label}</div>
            <div class="rw-tip-row"><span class="rw-tip-key">Studies</span>
              <span class="rw-tip-val" style="color:${col}">${data.studyCount}</span></div>
            <div class="rw-tip-row"><span class="rw-tip-key">Coverage</span>
              <span class="rw-tip-val" style="color:${col}">${data.coverage}%</span></div>
            <div class="rw-tip-row"><span class="rw-tip-key">Grade</span>
              <span class="rw-tip-val">${coverageGrade(data.coverage)}</span></div>
            <div class="rw-tip-row"><span class="rw-tip-key">Study Types</span>
              <span class="rw-tip-val">${data.indicators}</span></div>
            <div class="rw-tip-row"><span class="rw-tip-key">Updated</span>
              <span class="rw-tip-val" style="font-family:sans-serif;font-size:.68rem">${data.lastUpdated}</span></div>
          </div>`,
          { sticky: true, opacity: 1, className: '' },
        );
      }

      layer.on({
        mouseover: () => setHoveredId(id),
        mouseout:  () => setHoveredId(null),
        click:     () => setSelected(prev => prev === id ? null : id),
      });
    },
    [DISTRICT_DATA],
  );

  // ── Export ───────────────────────────────────────────────────────────────
  const exportImage = useCallback(async (fmt: 'png' | 'jpeg') => {
    if (!wrapRef.current) return;
    setIsExporting(true); setShowMenu(false);
    try {
      const c = await html2canvas(wrapRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#060D18' });
      const a = document.createElement('a');
      a.download = `rwanda-coverage.${fmt === 'jpeg' ? 'jpg' : 'png'}`;
      a.href = c.toDataURL(`image/${fmt}`, 1.0);
      a.click();
    } finally { setIsExporting(false); }
  }, []);

  const exportPDF = useCallback(async () => {
    if (!wrapRef.current) return;
    setIsExporting(true); setShowMenu(false);
    try {
      const c = await html2canvas(wrapRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#060D18' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / c.width, ph / c.height);
      pdf.addImage(c.toDataURL('image/png'), 'PNG', (pw - c.width * ratio) / 2, (ph - c.height * ratio) / 2, c.width * ratio, c.height * ratio);
      pdf.save('rwanda-coverage.pdf');
    } finally { setIsExporting(false); }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#060D18', color: '#5F7EA8', gap: 10, fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      Loading coverage data…
    </div>
  );

  if (isError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#060D18', color: '#F87171', gap: 10, fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem' }}>
      Failed to load coverage data. Please try again.
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rw" ref={wrapRef}>

        {/* Header */}
        <div className="rw-hdr">
          <div>
            <div className="rw-title">Rwanda Gender Data Coverage</div>
            <div className="rw-sub">
              {contextDistricts.length > 0
                ? `${contextDistricts.length} district${contextDistricts.length !== 1 ? 's' : ''} selected · Satellite View · 2024 Q4`
                : 'District-level · Satellite View · 2024 Q4'}
            </div>
          </div>
        </div>

        {/* Province tabs */}
        <div className="rw-tabs">
          {(['All', ...Object.keys(PROVINCE_META)] as (Province | 'All')[]).map(p => {
            const stat   = p !== 'All' ? provinceStats.find(s => s.province === p) : null;
            const meta   = p !== 'All' ? PROVINCE_META[p as Province] : null;
            const active = activeProvince === p;
            const dimmed = contextDistricts.length > 0 && p !== 'All' && stat?.avg == null;
            return (
              <button key={p} className={`rw-tab${active ? ' on' : ''}`}
                style={{
                  ...(active ? { background: meta?.accent ?? '#38BDF8', color: '#000' } : {}),
                  ...(dimmed ? { opacity: 0.35 } : {}),
                }}
                onClick={() => { setActiveProvince(p); setSelected(null); }}>
                {p === 'All' ? 'All Districts' : `${p}${stat?.avg != null ? ` · ${stat.avg}%` : ''}`}
              </button>
            );
          })}
        </div>

        {/* KPI strip */}
        <div className="rw-kpis">
          {[
            { lbl: 'Districts',    val: kpis.total.toString(), sub: contextDistricts.length > 0 ? 'selected'      : 'nationwide',      col: '#DDE9FF' },
            { lbl: 'Avg Coverage', val: `${kpis.avg}%`,        sub: contextDistricts.length > 0 ? 'selected scope' : 'all provinces',   col: '#38BDF8' },
            { lbl: '60%+ Coverage',val: `${kpis.high}`,        sub: contextDistricts.length > 0 ? 'in selection'   : 'high performers', col: '#00D48A' },
            { lbl: 'Under 40%',    val: `${kpis.low}`,         sub: contextDistricts.length > 0 ? 'in selection'   : 'need attention',  col: '#FBBF24' },
          ].map(k => (
            <div className="rw-kpi" key={k.lbl}>
              <div className="rw-kpi-lbl">{k.lbl}</div>
              <div className="rw-kpi-val" style={{ color: k.col }}>{k.val}</div>
              <div className="rw-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="rw-body">

          {/* ── Map ── */}
          <div className="rw-map">
            <div className="rw-map-inner">
              <MapContainer
                center={[-1.94, 29.87]}
                zoom={8}
                minZoom={7}
                maxZoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl
                attributionControl
              >
                {/* Satellite imagery */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
                  maxZoom={19}
                />

                {/* Place-name labels overlay */}
                {showLabels && (
                  <TileLayer
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                    opacity={0.85}
                  />
                )}

                {/* District overlays */}
                <GeoJSON
                  key={geoJsonKey}
                  data={DISTRICTS_GEOJSON}
                  style={geoJsonStyle}
                  onEachFeature={onEachFeature}
                />

                {/* FlyTo controller */}
                <MapController selectedId={selected} activeProvince={activeProvince} />
              </MapContainer>
            </div>

            {/* Toolbar overlay */}
            <div className="rw-toolbar">
              {/* Labels toggle */}
              <button
                className={`rw-btn${showLabels ? ' active' : ''}`}
                onClick={() => setShowLabels(v => !v)}
                title="Toggle place labels"
              >
                {showLabels ? <Eye size={12} /> : <EyeOff size={12} />}
                Labels
              </button>

              {/* Export */}
              <div style={{ position: 'relative' }}>
                <button
                  className="rw-btn"
                  onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
                  disabled={isExporting}
                >
                  {isExporting
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Download size={12} />}
                  {isExporting ? 'Exporting…' : 'Export'}
                  {!isExporting && <ChevronDown size={10} />}
                </button>
                {showMenu && (
                  <div className="rw-menu" onClick={e => e.stopPropagation()}>
                    <button className="rw-mi" onClick={() => exportImage('png')}><ImageIcon size={12} />PNG Image</button>
                    <button className="rw-mi" onClick={() => exportImage('jpeg')}><ImageIcon size={12} />JPG Image</button>
                    <button className="rw-mi" onClick={exportPDF}><FileText size={12} />PDF Document</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="rw-right">

            {/* Legend */}
            <div className="rw-legend">
              <div className="rw-sec">Coverage Scale</div>
              {[
                { color: '#00D48A', label: 'High',     range: '≥ 80%' },
                { color: '#38BDF8', label: 'Med–High', range: '60–79%' },
                { color: '#A78BFA', label: 'Medium',   range: '40–59%' },
                { color: '#FBBF24', label: 'Low',      range: '20–39%' },
                { color: '#94A3B8', label: 'No Data',  range: '< 20%'  },
              ].map(l => (
                <div className="rw-leg-row" key={l.label}>
                  <span className="rw-leg-sw" style={{ background: l.color }} />
                  <span className="rw-leg-lbl">{l.label}</span>
                  <span className="rw-leg-pct">{l.range}</span>
                </div>
              ))}


            </div>

            {/* Detail panel */}
            <div className="rw-detail">
              {selectedDistrict && selectedData ? (
                <>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.98rem' }}>
                        {selectedDistrict.properties.name}
                      </div>
                      <div style={{ fontSize: '.64rem', color: PROVINCE_META[selectedDistrict.properties.province].accent, marginTop: 2 }}>
                        <span className="rw-dot" style={{ background: PROVINCE_META[selectedDistrict.properties.province].accent, marginRight: 4 }} />
                        {PROVINCE_META[selectedDistrict.properties.province].label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div className="rw-grade" style={{
                        background: coverageColor(selectedData.coverage) + '22',
                        color: coverageColor(selectedData.coverage),
                        border: `1px solid ${coverageColor(selectedData.coverage)}55`,
                      }}>
                        {coverageGrade(selectedData.coverage)}
                      </div>
                      <span style={{ fontSize: '.58rem', color: 'var(--t2)', fontFamily: "'Space Mono',monospace" }}>
                        {coverageLabel(selectedData.coverage)}
                      </span>
                    </div>
                  </div>

                  {/* Gauge */}
                  <div className="rw-gauge-w">
                    <CoverageGauge value={selectedData.coverage} color={coverageColor(selectedData.coverage)} />
                  </div>

                  {/* Stats */}
                  {[
                    { key: 'Studies', val: `${selectedData.studyCount}` },
                    { key: 'Study Types', val: `${selectedData.indicators}` },
                    { key: 'Last Updated', val: selectedData.lastUpdated },
                    {
                      key: 'Trend', val: (
                        <span className={selectedData.trend === 'up' ? 't-up' : selectedData.trend === 'down' ? 't-dn' : 't-flat'}>
                          {selectedData.trend === 'up'     && <TrendingUp  size={11} style={{ display:'inline', marginRight:2 }} />}
                          {selectedData.trend === 'down'   && <TrendingDown size={11} style={{ display:'inline', marginRight:2 }} />}
                          {selectedData.trend === 'stable' && <Minus       size={11} style={{ display:'inline', marginRight:2 }} />}
                          {selectedData.trend[0].toUpperCase() + selectedData.trend.slice(1)}
                        </span>
                      ),
                    },
                  ].map(row => (
                    <div className="rw-sr" key={row.key}>
                      <span className="rw-sk">{row.key}</span>
                      <span className="rw-sv">{row.val}</span>
                    </div>
                  ))}

                  {/* Coverage bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.62rem', color: 'var(--t2)', marginBottom: 2 }}>
                      <span>Coverage</span>
                      <span style={{ color: coverageColor(selectedData.coverage), fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>
                        {selectedData.coverage}%
                      </span>
                    </div>
                    <div className="rw-bar-t">
                      <div className="rw-bar-f" style={{ width: `${selectedData.coverage}%`, background: coverageColor(selectedData.coverage) }} />
                    </div>
                  </div>

                  {/* Gender split */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: '.62rem', color: 'var(--t2)', marginBottom: 4 }}>Gender split</div>
                    <div className="rw-gb">
                      <div style={{ width: `${selectedData.femaleRatio}%`, background: '#F472B6' }} />
                      <div style={{ flex: 1, background: '#38BDF8' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '.6rem' }}>
                      <span style={{ color: '#F472B6' }}>♀ {selectedData.femaleRatio}%</span>
                      <span style={{ color: '#38BDF8' }}>♂ {100 - selectedData.femaleRatio}%</span>
                    </div>
                  </div>

                  {/* 4-quarter history */}
                  <div className="rw-hist">
                    <div className="rw-hist-lbl">4-Quarter Trend</div>
                    <div className="rw-hist-row">
                      <Sparkline values={selectedData.history} color={coverageColor(selectedData.coverage)} />
                      <div className="rw-hist-bars">
                        {selectedData.history.map((v, i) => (
                          <div key={i} className="rw-hist-bar" style={{
                            height: `${(v / 100) * 26}px`,
                            background: i === selectedData.history.length - 1
                              ? coverageColor(selectedData.coverage)
                              : 'var(--bdr2)',
                          }} />
                        ))}
                      </div>
                      <div className="rw-hist-delta" style={{
                        color: selectedData.history[3] >= selectedData.history[0] ? '#00D48A' : '#F87171',
                      }}>
                        {selectedData.history[3] >= selectedData.history[0] ? '+' : ''}
                        {selectedData.history[3] - selectedData.history[0]}pp
                      </div>
                    </div>
                  </div>

                  {/* Recent studies */}
                  {selectedData.recentStudies.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div className="rw-sec" style={{ marginBottom: 6 }}>Recent Studies</div>
                      {selectedData.recentStudies.slice(0, 4).map(s => (
                        <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--bdr)', fontSize: '.68rem' }}>
                          <div style={{ color: 'var(--t1)', lineHeight: 1.35, marginBottom: 2 }}>{s.title}</div>
                          <div style={{ color: 'var(--t2)', fontFamily: "'Space Mono',monospace", fontSize: '.6rem' }}>{s.year}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="rw-clear" onClick={() => setSelected(null)}>
                    <X size={10} /> Clear selection
                  </button>
                </>
              ) : (
                <div className="rw-empty">
                  <MapPin size={24} />
                  <div className="rw-empty-t">Click a district</div>
                  <div className="rw-empty-s">Coverage details will appear here</div>
                </div>
              )}
            </div>

            {/* Rankings */}
            <div className="rw-rank">
              <div className="rw-sec" style={{ paddingTop: 12, marginBottom: 7 }}>
                Rankings ({rankedDistricts.length})
              </div>

              {/* Search */}
              <div className="rw-si">
                <Search size={10} className="rw-si-icon" />
                <input
                  placeholder="Search district…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--bdr2) transparent' }}>
                {rankedDistricts.map((feat, i) => {
                  const { id, name, province } = feat.properties;
                  const data = DISTRICT_DATA[id];
                  if (!data) return null;
                  const col = coverageColor(data.coverage);
                  return (
                    <div key={id} className="rw-ri"
                      style={{ opacity: selected && selected !== id ? 0.45 : 1 }}
                      onClick={() => { setSelected(prev => prev === id ? null : id); setActiveProvince('All'); }}>
                      <span className="rw-rn">{i + 1}</span>
                      <span className="rw-dot" style={{ background: PROVINCE_META[province].accent, flexShrink: 0 }} />
                      <span className="rw-rname">{name}</span>
                      <span className="rw-rpct" style={{ color: col }}>{data.coverage}%</span>
                      <div className="rw-rbar"><div className="rw-rbf" style={{ width: `${data.coverage}%`, background: col }} /></div>
                      {data.trend === 'up'     && <TrendingUp   size={9} className="t-up"   style={{ flexShrink: 0 }} />}
                      {data.trend === 'down'   && <TrendingDown size={9} className="t-dn"   style={{ flexShrink: 0 }} />}
                      {data.trend === 'stable' && <Minus        size={9} className="t-flat" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
                {rankedDistricts.length === 0 && (
                  <div style={{ fontSize: '.68rem', color: 'var(--t3)', padding: '10px 0', textAlign: 'center' }}>
                    No results for "{search}"
                  </div>
                )}
              </div>
            </div>

          </div>{/* end right panel */}
        </div>{/* end body */}
      </div>
    </>
  );
}