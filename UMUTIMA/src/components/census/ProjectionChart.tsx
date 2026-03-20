import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { CensusProjection } from '../../lib/api';

interface Props {
  projections: CensusProjection[];
}

export default function ProjectionChart({ projections }: Props) {
  const data = projections.map(p => ({
    year: p.year,
    'Medium (Total)': parseFloat(p.medium_total),
    'Medium (Urban)': parseFloat(p.medium_urban),
    'Medium (Rural)': parseFloat(p.medium_rural),
    'High': parseFloat(p.high_total),
    'Low': parseFloat(p.low_total),
  }));

  return (
    <div className="bg-white rounded-xl border border-light-gray p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-rich-black">Population Projections 2022–2052</h3>
        <span className="text-[10px] text-dark-gray bg-off-white border border-light-gray rounded px-2 py-0.5">
          NISR Medium Scenario
        </span>
      </div>
      <p className="text-xs text-dark-gray mb-3">Population in millions</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} interval={4} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} tickFormatter={v => `${v}M`} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
            formatter={(v: number) => [`${v.toFixed(1)}M`, '']}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="Medium (Total)" stroke="#00A1DE" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="Medium (Urban)" stroke="#7C3AED" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="Medium (Rural)" stroke="#20603D" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="High" stroke="#F97316" strokeWidth={1} dot={false} strokeDasharray="2 3" />
          <Line type="monotone" dataKey="Low" stroke="#94A3B8" strokeWidth={1} dot={false} strokeDasharray="2 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
