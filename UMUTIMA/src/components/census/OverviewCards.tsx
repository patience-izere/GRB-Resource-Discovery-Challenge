import React from 'react';
import { Users, UserCheck, Activity, Zap, Wheat, BookOpen, Droplets } from 'lucide-react';
import type { CensusOverview } from '../../lib/api';

interface Props {
  data: CensusOverview;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function OverviewCards({ data }: Props) {
  const female_pct = data.total_population
    ? ((data.female_population / data.total_population) * 100).toFixed(1)
    : '—';
  const male_pct = data.total_population
    ? ((data.male_population / data.total_population) * 100).toFixed(1)
    : '—';

  const cards = [
    {
      label: 'Total Population',
      value: fmt(data.total_population),
      sub: `Census ${data.census_year}`,
      icon: <Users className="w-4 h-4" />,
      color: '#00A1DE',
    },
    {
      label: 'Female',
      value: fmt(data.female_population),
      sub: `${female_pct}% of total`,
      icon: <UserCheck className="w-4 h-4" />,
      color: '#EC4899',
    },
    {
      label: 'Male',
      value: fmt(data.male_population),
      sub: `${male_pct}% of total`,
      icon: <UserCheck className="w-4 h-4" />,
      color: '#00A1DE',
    },
    {
      label: 'Pop. Density',
      value: data.population_density != null ? `${data.population_density}/km²` : '—',
      sub: 'National average',
      icon: <Activity className="w-4 h-4" />,
      color: '#7C3AED',
    },
    {
      label: 'Health Insurance',
      value: data.insurance_coverage_pct ? `${data.insurance_coverage_pct}%` : '—',
      sub: 'Coverage rate',
      icon: <Activity className="w-4 h-4" />,
      color: '#20603D',
    },
    {
      label: 'Primary Attendance',
      value: data.primary_net_attendance_pct ? `${data.primary_net_attendance_pct}%` : '—',
      sub: 'Net attendance rate',
      icon: <BookOpen className="w-4 h-4" />,
      color: '#F97316',
    },
    {
      label: 'Agric. Households',
      value: data.agricultural_households_pct ? `${data.agricultural_households_pct}%` : '—',
      sub: 'Of all households',
      icon: <Wheat className="w-4 h-4" />,
      color: '#16a34a',
    },
    {
      label: 'Electricity Access',
      value: data.electricity_access_pct ? `${data.electricity_access_pct}%` : '—',
      sub: 'Of households',
      icon: <Zap className="w-4 h-4" />,
      color: '#FAD201',
    },
    {
      label: 'Safe Water',
      value: data.water_access_pct ? `${data.water_access_pct}%` : '—',
      sub: 'Improved source',
      icon: <Droplets className="w-4 h-4" />,
      color: '#0EA5E9',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-light-gray p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span style={{ color: card.color }}>{card.icon}</span>
            <span className="text-[10px] font-semibold text-dark-gray uppercase tracking-wider leading-tight">
              {card.label}
            </span>
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="text-[10px] text-dark-gray">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
