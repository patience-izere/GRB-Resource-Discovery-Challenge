import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import type { CensusRegion } from '../../lib/api';

interface Props {
  regions: CensusRegion[];
  level: 'province' | 'district';
}

const PROVINCE_COLORS: Record<string, string> = {
  'City of Kigali': '#00A1DE',
  'Southern Province': '#20603D',
  'Western Province': '#7C3AED',
  'Northern Province': '#F97316',
  'Eastern Province': '#FAD201',
};

function shortName(name: string): string {
  return name
    .replace('City of Kigali', 'Kigali')
    .replace(' Province', '')
    .trim();
}

export default function RegionalChart({ regions, level }: Props) {
  const data = regions.map(r => ({
    name: shortName(r.name),
    fullName: r.name,
    total: r.total,
    male: r.male,
    female: r.female,
    density: r.density,
  }));

  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      {/* Population by region */}
      <div className="bg-white rounded-xl border border-light-gray p-4">
        <h3 className="text-sm font-semibold text-rich-black mb-3">
          Population by {isProvince ? 'Province' : 'District'}
        </h3>
        <ResponsiveContainer width="100%" height={isProvince ? 220 : 340}>
          <BarChart
            data={data}
            layout={isProvince ? 'horizontal' : 'vertical'}
            margin={{ top: 0, right: 16, left: isProvince ? 0 : 60, bottom: isProvince ? 40 : 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            {isProvince ? (
              <>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} angle={-20} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`} />
              </>
            ) : (
              <>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#1A1A1A' }} width={58} interval={0} />
              </>
            )}
            <Tooltip
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
              formatter={(value: number) => [value.toLocaleString(), '']}
              labelFormatter={(label) => data.find(d => d.name === label)?.fullName ?? label}
            />
            <Bar dataKey="female" name="Female" stackId="a" fill="#EC4899" barSize={isProvince ? 28 : 14} />
            <Bar dataKey="male" name="Male" stackId="a" fill="#00A1DE" radius={isProvince ? [4,4,0,0] : [0,4,4,0]} barSize={isProvince ? 28 : 14} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Population density */}
      {isProvince && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h3 className="text-sm font-semibold text-rich-black mb-3">Population Density (per km²)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} angle={-20} textAnchor="end" interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v} /km²`, 'Density']}
              />
              <Bar dataKey="density" name="Density" radius={[4,4,0,0]} barSize={32}>
                {data.map(entry => (
                  <Cell key={entry.name} fill={PROVINCE_COLORS[entry.fullName] ?? '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
