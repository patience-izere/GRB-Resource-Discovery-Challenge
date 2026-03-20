import React, { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import type { CensusDeviationsData } from '../../lib/api';

interface Props {
  data: CensusDeviationsData;
}

type SortKey = 'name' | 'province' | 'primary_nar' | 'insurance_pct' | 'electricity_pct' | 'water_pct' | 'firewood_pct' | 'agric_hh_pct';
type SortDir = 'asc' | 'desc';

const INDICATORS: { key: keyof CensusDeviationsData['districts'][0]; label: string; bad: 'low' | 'high'; suffix: string }[] = [
  { key: 'primary_nar',     label: 'Primary NAR',   bad: 'low',  suffix: '%' },
  { key: 'insurance_pct',   label: 'Insurance',      bad: 'low',  suffix: '%' },
  { key: 'electricity_pct', label: 'Electricity',    bad: 'low',  suffix: '%' },
  { key: 'water_pct',       label: 'Safe Water',     bad: 'low',  suffix: '%' },
  { key: 'firewood_pct',    label: 'Firewood Use',   bad: 'high', suffix: '%' },
  { key: 'agric_hh_pct',    label: 'Agric HH',       bad: 'high', suffix: '%' },
];

function deviation(value: number | null, avg: number, bad: 'low' | 'high'): number | null {
  if (value == null) return null;
  return bad === 'low' ? value - avg : avg - value;
}

function CellValue({ value, avg, bad, suffix }: { value: number | null; avg: number; bad: 'low' | 'high'; suffix: string }) {
  if (value == null) return <span className="text-medium-gray">—</span>;
  const dev = deviation(value, avg, bad);
  const isGood = dev != null && dev >= 0;
  const isVeryBad = dev != null && dev < -5;
  const isBad = dev != null && dev < 0;

  return (
    <span className={`font-mono text-xs font-semibold ${isGood ? 'text-green-700' : isVeryBad ? 'text-red-600' : isBad ? 'text-orange-600' : 'text-rich-black'}`}>
      {value}{suffix}
    </span>
  );
}

function DevBadge({ value, avg, bad }: { value: number | null; avg: number; bad: 'low' | 'high' }) {
  if (value == null) return null;
  const dev = deviation(value, avg, bad);
  if (dev == null || Math.abs(dev) < 0.5) return null;
  return (
    <span className={`ml-1 text-[9px] font-mono ${dev > 0 ? 'text-green-600' : 'text-red-500'}`}>
      {dev > 0 ? '+' : ''}{dev.toFixed(1)}
    </span>
  );
}

export default function DeviationsTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('primary_nar');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [threshold, setThreshold] = useState<string>('');
  const [thresholdKey, setThresholdKey] = useState<string>('primary_nar');

  const provinces = useMemo(() => {
    const set = new Set(data.districts.map(d => d.province).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [data.districts]);

  const avgs = data.national_averages;

  const sorted = useMemo(() => {
    let rows = [...data.districts];

    // Province filter
    if (filterProvince !== 'all') {
      rows = rows.filter(d => d.province === filterProvince);
    }

    // Threshold filter
    const tval = parseFloat(threshold);
    if (!isNaN(tval) && thresholdKey) {
      const ind = INDICATORS.find(i => i.key === thresholdKey);
      if (ind) {
        rows = rows.filter(d => {
          const v = d[ind.key as keyof typeof d] as number | null;
          if (v == null) return false;
          return ind.bad === 'high' ? v > tval : v < tval;
        });
      }
    }

    // Sort
    rows.sort((a, b) => {
      const av = a[sortKey as keyof typeof a] as any;
      const bv = b[sortKey as keyof typeof b] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [data.districts, sortKey, sortDir, filterProvince, threshold, thresholdKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const belowCount = data.districts.filter(d =>
    INDICATORS.some(ind => {
      const v = d[ind.key as keyof typeof d] as number | null;
      const avg = avgs[ind.key as keyof typeof avgs] as number;
      if (v == null) return false;
      return ind.bad === 'low' ? v < avg - 2 : v > avg + 2;
    })
  ).length;

  return (
    <div className="bg-white rounded-xl border border-light-gray p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-rich-black flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            District Deviations from National Average
          </h3>
          <p className="text-xs text-dark-gray mt-0.5">
            {belowCount} of {data.districts.length} districts perform &gt;2% below national average on at least one indicator.
            <span className="ml-2 text-green-600 font-semibold">Green</span> = above avg ·{' '}
            <span className="text-orange-600 font-semibold">Amber</span> = below ·{' '}
            <span className="text-red-600 font-semibold">Red</span> = &gt;5% below
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Province filter */}
          <select
            value={filterProvince}
            onChange={e => setFilterProvince(e.target.value)}
            className="text-xs border border-light-gray rounded-lg px-2 py-1.5 bg-white text-dark-gray"
          >
            {provinces.map(p => (
              <option key={p} value={p}>{p === 'all' ? 'All Provinces' : p.replace(' Province', '').replace('\xa0', ' ').trim()}</option>
            ))}
          </select>

          {/* Threshold filter */}
          <div className="flex items-center gap-1 border border-light-gray rounded-lg px-2 py-1 text-xs">
            <SlidersHorizontal className="w-3 h-3 text-dark-gray" />
            <select value={thresholdKey} onChange={e => setThresholdKey(e.target.value)}
              className="text-xs bg-transparent text-dark-gray outline-none">
              {INDICATORS.map(i => <option key={i.key as string} value={i.key as string}>{i.label}</option>)}
            </select>
            <span className="text-medium-gray">{INDICATORS.find(i => i.key === thresholdKey)?.bad === 'high' ? '>' : '<'}</span>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              placeholder="threshold"
              className="w-16 text-xs outline-none text-dark-gray bg-transparent"
            />
            {threshold && (
              <button onClick={() => setThreshold('')} className="text-medium-gray hover:text-dark-gray ml-1">×</button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-light-gray">
              {[
                { key: 'name' as SortKey, label: 'District' },
                { key: 'province' as SortKey, label: 'Province' },
              ].map(col => (
                <th key={col.key} className="text-left py-2 pr-3 font-semibold text-dark-gray uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort(col.key)}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </span>
                </th>
              ))}
              {INDICATORS.map(ind => (
                <th key={ind.key as string}
                  className="text-right py-2 px-2 font-semibold text-dark-gray uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort(ind.key as SortKey)}>
                  <span className="flex items-center justify-end gap-1">
                    {ind.label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </span>
                </th>
              ))}
            </tr>
            {/* National averages row */}
            <tr className="border-b-2 border-rwanda-blue bg-off-white">
              <td className="py-1.5 pr-3 font-semibold text-rwanda-blue" colSpan={2}>National Average</td>
              {INDICATORS.map(ind => (
                <td key={ind.key as string} className="py-1.5 px-2 text-right font-mono font-semibold text-rwanda-blue">
                  {avgs[ind.key as keyof typeof avgs] ?? '—'}{ind.suffix}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => (
              <tr key={d.name} className="border-b border-light-gray hover:bg-off-white transition-colors">
                <td className="py-2 pr-3 font-semibold text-rich-black whitespace-nowrap">{d.name}</td>
                <td className="py-2 pr-3 text-dark-gray whitespace-nowrap">
                  {d.province?.replace(' Province', '').replace('\xa0', ' ').trim()}
                </td>
                {INDICATORS.map(ind => (
                  <td key={ind.key as string} className="py-2 px-2 text-right">
                    <CellValue
                      value={d[ind.key as keyof typeof d] as number | null}
                      avg={avgs[ind.key as keyof typeof avgs] as number}
                      bad={ind.bad}
                      suffix={ind.suffix}
                    />
                    <DevBadge
                      value={d[ind.key as keyof typeof d] as number | null}
                      avg={avgs[ind.key as keyof typeof avgs] as number}
                      bad={ind.bad}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-dark-gray">No districts match the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-medium-gray mt-3">
        Deviation shown as +/− difference from national average. Source: NISR PHC 2022.
      </p>
    </div>
  );
}
