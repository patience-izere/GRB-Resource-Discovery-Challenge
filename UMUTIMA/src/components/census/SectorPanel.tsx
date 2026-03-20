import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from 'recharts';

interface Props {
  sector: string;
  data: any;
  level: 'province' | 'district';
}

function shortName(name: string): string {
  if (!name) return '';
  return name
    .replace('City of Kigali', 'Kigali')
    .replace(' Province', '')
    .replace('\xa0', ' ')
    .trim();
}

function StatCard({ label, value, sub, color = '#00A1DE' }: { label: string; value: any; sub?: string; color?: string }) {
  return (
    <div className="bg-off-white rounded-lg border border-light-gray p-3 text-center">
      <div className="text-xl font-bold font-mono" style={{ color }}>{value ?? '—'}</div>
      <div className="text-xs font-semibold text-dark-gray mt-1">{label}</div>
      {sub && <div className="text-[10px] text-medium-gray mt-0.5">{sub}</div>}
    </div>
  );
}

function HBarChart({ data, dataKey, label, color = '#00A1DE', domain, formatter, height }:
  { data: any[]; dataKey: string; label: string; color?: string; domain?: [number, number]; formatter?: (v: number) => string; height?: number }) {
  const isVertical = data.length > 6;
  const h = height ?? (isVertical ? Math.max(280, data.length * 18) : 200);
  const fmt = formatter ?? ((v: number) => `${v}`);
  return (
    <div className="bg-white rounded-xl border border-light-gray p-4">
      <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">{label}</h4>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 0, right: 16, left: isVertical ? 64 : 0, bottom: isVertical ? 0 : 36 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          {isVertical ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={domain} tickFormatter={fmt} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={domain} tickFormatter={fmt} />
            </>
          )}
          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
            formatter={(v: number) => [fmt(v), '']} />
          <Bar dataKey={dataKey} fill={color} barSize={isVertical ? 10 : 26} radius={isVertical ? [0, 3, 3, 0] : [3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────
function EducationPanel({ data, level }: { data: any; level: string }) {
  const primary = (data.primary_attendance ?? []).map((r: any) => ({
    name: shortName(r.name),
    'NAR Male': parseFloat(r.nar_male) || 0,
    'NAR Female': parseFloat(r.nar_female) || 0,
  }));

  const secondary = (data.secondary_attendance ?? []).map((r: any) => ({
    name: shortName(r.name),
    'NAR Male': parseFloat(r.nar_male) || 0,
    'NAR Female': parseFloat(r.nar_female) || 0,
  }));

  const oos = (data.out_of_school ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Out-of-School %': parseFloat(r.out_of_school_pct) || 0,
    out_of_school_count: r.out_of_school_count,
  }));

  const nat = data.national ?? {};
  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Primary NAR" value={nat.primary_nar != null ? `${nat.primary_nar}%` : null} sub="Both sexes" color="#00A1DE" />
        <StatCard label="Primary NAR Male" value={nat.primary_nar_male != null ? `${nat.primary_nar_male}%` : null} color="#00A1DE" />
        <StatCard label="Primary NAR Female" value={nat.primary_nar_female != null ? `${nat.primary_nar_female}%` : null} color="#EC4899" />
        <StatCard label="Out-of-School" value={nat.out_of_school_count != null ? Number(nat.out_of_school_count).toLocaleString() : null} sub={nat.out_of_school_pct != null ? `${nat.out_of_school_pct}% of 6–17 yr olds` : undefined} color="#F97316" />
      </div>

      {/* Primary NAR by gender */}
      <div className="bg-white rounded-xl border border-light-gray p-4">
        <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
          Primary School Net Attendance Rate(NAR) — by {isProvince ? 'Province' : 'District'}
        </h4>
        <ResponsiveContainer width="100%" height={isProvince ? 210 : Math.max(300, primary.length * 18)}>
          <BarChart data={primary} layout={isProvince ? 'horizontal' : 'vertical'}
            margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            {isProvince ? (
              <>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              </>
            ) : (
              <>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
              </>
            )}
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
              formatter={(v: number) => [`${v}%`, '']} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="NAR Male" fill="#00A1DE" barSize={isProvince ? 18 : 10} radius={[2, 2, 0, 0]} />
            <Bar dataKey="NAR Female" fill="#EC4899" barSize={isProvince ? 18 : 10} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Out-of-school children */}
      {oos.length > 0 && (
        <HBarChart
          data={oos}
          dataKey="Out-of-School %"
          label={`Out-of-School Children (%) by ${isProvince ? 'Province' : 'District'}`}
          color="#F97316"
          domain={[0, 30]}
          formatter={(v) => `${v}%`}
        />
      )}

      {/* Secondary NAR */}
      {secondary.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-1 uppercase tracking-wider">
            Secondary School NAR — by {isProvince ? 'Province' : 'District'}
          </h4>
          <p className="text-xs text-dark-gray mb-3">
            National: Male {nat.secondary_nar_male ?? '—'}% · Female {nat.secondary_nar_female ?? '—'}%
          </p>
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(280, secondary.length * 18)}>
            <BarChart data={secondary} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="NAR Male" fill="#00A1DE" barSize={isProvince ? 18 : 10} radius={[2, 2, 0, 0]} />
              <Bar dataKey="NAR Female" fill="#EC4899" barSize={isProvince ? 18 : 10} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Health ────────────────────────────────────────────────────────────────────
function HealthPanel({ data, level }: { data: any; level: string }) {
  const insurance = (data.insurance ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Urban': parseFloat(r.coverage_urban) || 0,
    'Rural': parseFloat(r.coverage_rural) || 0,
  }));

  const fertility = (data.fertility ?? []).map((r: any) => ({
    name: shortName(r.name),
    'GFR': parseFloat(r.gfr) || 0,
  }));

  const tfr = (data.tfr ?? []).map((r: any) => ({
    name: shortName(r.name),
    'TFR': parseFloat(r.tfr) || 0,
  }));

  const nat = data.national ?? {};
  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Insurance (Both)" value={nat.coverage_both != null ? `${nat.coverage_both}%` : null} color="#20603D" />
        <StatCard label="Insurance (Male)" value={nat.coverage_male != null ? `${nat.coverage_male}%` : null} color="#00A1DE" />
        <StatCard label="Insurance (Female)" value={nat.coverage_female != null ? `${nat.coverage_female}%` : null} color="#EC4899" />
        <StatCard label="Total Fertility Rate" value={nat.tfr != null ? `${nat.tfr}` : null} sub="Children per woman" color="#7C3AED" />
      </div>

      {/* Insurance urban/rural */}
      <div className="bg-white rounded-xl border border-light-gray p-4">
        <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
          Health Insurance Coverage — by {isProvince ? 'Province' : 'District'}
        </h4>
        <ResponsiveContainer width="100%" height={isProvince ? 210 : Math.max(300, insurance.length * 18)}>
          <BarChart data={insurance} layout={isProvince ? 'horizontal' : 'vertical'}
            margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            {isProvince ? (
              <>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
              </>
            ) : (
              <>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[70, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
              </>
            )}
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
              formatter={(v: number) => [`${v}%`, '']} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Urban" fill="#00A1DE" barSize={isProvince ? 18 : 8} />
            <Bar dataKey="Rural" fill="#20603D" barSize={isProvince ? 18 : 8} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TFR by province */}
      {tfr.length > 0 && (
        <HBarChart
          data={tfr}
          dataKey="TFR"
          label={`Total Fertility Rate by ${isProvince ? 'Province' : 'District'}`}
          color="#7C3AED"
          formatter={(v) => `${v} children/woman`}
        />
      )}

      {/* GFR */}
      {fertility.length > 0 && (
        <HBarChart
          data={fertility}
          dataKey="GFR"
          label={`General Fertility Rate (births per 1,000 women aged 15–49) — ${isProvince ? 'Province' : 'District'}`}
          color="#EC4899"
        />
      )}
    </div>
  );
}

// ── Agriculture ───────────────────────────────────────────────────────────────
function AgriculturePanel({ data, level }: { data: any; level: string }) {
  const regions = (data.by_region ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Agric HH %': parseFloat(r.agric_hh_pct) || 0,
  }));

  const genderHH = (data.gender_hh ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Male-Headed': parseFloat(r.agric_pct_male_head) || 0,
    'Female-Headed': parseFloat(r.agric_pct_female_head) || 0,
  }));

  const natCrops = data.national_crops ?? {};
  const cropRadar = [
    { crop: 'Beans', pct: parseFloat(natCrops.bean) || 0 },
    { crop: 'Maize', pct: parseFloat(natCrops.maize) || 0 },
    { crop: 'Cassava', pct: parseFloat(natCrops.cassava) || 0 },
    { crop: 'Sweet Potato', pct: parseFloat(natCrops.sweet_potato) || 0 },
    { crop: 'Banana', pct: parseFloat(natCrops.banana) || 0 },
    { crop: 'Sorghum', pct: parseFloat(natCrops.sorghum) || 0 },
    { crop: 'Vegetables', pct: parseFloat(natCrops.vegetables) || 0 },
    { crop: 'Soybean', pct: parseFloat(natCrops.soybean) || 0 },
  ].filter(c => c.pct > 0).sort((a, b) => b.pct - a.pct);

  const nat = data.national ?? {};
  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Agric Households" value={nat.agric_hh_pct != null ? `${nat.agric_hh_pct}%` : null} sub="National" color="#16a34a" />
        <StatCard label="Total Households" value={nat.total_hh ? (nat.total_hh / 1_000_000).toFixed(2) + 'M' : null} color="#00A1DE" />
        <StatCard label="Male-Headed (Agric)" value={nat.agric_pct_male_head != null ? `${nat.agric_pct_male_head}%` : null} color="#00A1DE" />
        <StatCard label="Female-Headed (Agric)" value={nat.agric_pct_female_head != null ? `${nat.agric_pct_female_head}%` : null} sub="Land access gap" color="#EC4899" />
      </div>

      {/* Agric HH by region */}
      <HBarChart
        data={regions}
        dataKey="Agric HH %"
        label={`Agricultural Household Share (%) — ${isProvince ? 'Province' : 'District'}`}
        color="#16a34a"
        domain={[0, 100]}
        formatter={(v) => `${v}%`}
      />

      {/* Gender breakdown of agricultural HH */}
      {genderHH.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-1 uppercase tracking-wider">
            Agricultural HH by Gender of Household Head
          </h4>
          <p className="text-xs text-dark-gray mb-3">% of each gender's households that are agricultural — {isProvince ? 'province' : 'district'} level</p>
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(300, genderHH.length * 18)}>
            <BarChart data={genderHH} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Male-Headed" fill="#00A1DE" barSize={isProvince ? 18 : 8} />
              <Bar dataKey="Female-Headed" fill="#EC4899" barSize={isProvince ? 18 : 8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Crop types radar */}
      {cropRadar.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-1 uppercase tracking-wider">
            Crop Type Prevalence — National (% of farming households)
          </h4>
          <p className="text-xs text-dark-gray mb-3">Proportion of households cultivating each crop</p>
          <div className="flex gap-4 items-start flex-wrap">
            <ResponsiveContainer width="100%" height={220} style={{ flex: '0 0 240px', minWidth: 200 }}>
              <RadarChart data={cropRadar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="crop" tick={{ fontSize: 10, fill: '#4A5568' }} />
                <Radar dataKey="pct" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} dot={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Households']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex-1 min-w-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-light-gray">
                    <th className="text-left py-1.5 font-semibold text-dark-gray">Crop</th>
                    <th className="text-right py-1.5 font-semibold text-dark-gray">% of HH</th>
                  </tr>
                </thead>
                <tbody>
                  {cropRadar.map(c => (
                    <tr key={c.crop} className="border-b border-light-gray hover:bg-off-white">
                      <td className="py-1.5 text-rich-black">{c.crop}</td>
                      <td className="py-1.5 text-right font-mono text-rwanda-green">{c.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Households ────────────────────────────────────────────────────────────────
function HouseholdsPanel({ data, level }: { data: any; level: string }) {
  const electricity = (data.electricity ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Urban': parseFloat(r.electricity_urban) || 0,
    'Rural': parseFloat(r.electricity_rural) || 0,
  }));

  const water = (data.water ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Urban': parseFloat(r.water_urban) || 0,
    'Rural': parseFloat(r.water_rural) || 0,
  }));

  const cooking = (data.cooking ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Firewood': parseFloat(r.firewood_pct) || 0,
    'Charcoal': parseFloat(r.charcoal_pct) || 0,
    'Gas/LPG': parseFloat(r.gas_pct) || 0,
  }));

  const mobile = (data.mobile ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Urban': parseFloat(r.mobile_urban) || 0,
    'Rural': parseFloat(r.mobile_rural) || 0,
  }));

  const nat = data.national ?? {};
  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Electricity Access" value={nat.electricity_pct != null ? `${nat.electricity_pct}%` : null} sub="National" color="#FAD201" />
        <StatCard label="Safe Water" value={nat.water_pct != null ? `${nat.water_pct}%` : null} sub="Improved source" color="#00A1DE" />
        <StatCard label="Mobile Phone HH" value={nat.mobile_pct != null ? `${nat.mobile_pct}%` : null} sub="HH with phone" color="#7C3AED" />
        <StatCard label="Female-Headed HH" value={nat.female_hh_pct != null ? `${nat.female_hh_pct}%` : null} sub="Of all households" color="#EC4899" />
      </div>

      {/* National cooking energy summary */}
      <div className="bg-white rounded-xl border border-light-gray p-4">
        <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
          National Energy for Cooking (% of households)
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Firewood (Biomass)', value: nat.firewood_pct, color: '#92400e', warn: true },
            { label: 'Charcoal (Biomass)', value: nat.charcoal_pct, color: '#78350f', warn: true },
            { label: 'Gas / LPG (Clean)', value: nat.gas_pct, color: '#16a34a', warn: false },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-3 text-center ${s.warn ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value ?? '—'}%</div>
              <div className="text-xs text-dark-gray mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cooking energy by province/district */}
        {cooking.length > 0 && (
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(300, cooking.length * 18)}>
            <BarChart data={cooking} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Firewood" fill="#92400e" barSize={isProvince ? 16 : 7} />
              <Bar dataKey="Charcoal" fill="#b45309" barSize={isProvince ? 16 : 7} />
              <Bar dataKey="Gas/LPG" fill="#16a34a" barSize={isProvince ? 16 : 7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Electricity access */}
      {electricity.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
            Electricity Access — {isProvince ? 'Province' : 'District'}
          </h4>
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(300, electricity.length * 18)}>
            <BarChart data={electricity} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Urban" fill="#F97316" barSize={isProvince ? 18 : 8} />
              <Bar dataKey="Rural" fill="#FAD201" barSize={isProvince ? 18 : 8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Safe water */}
      {water.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
            Improved Drinking Water Access — {isProvince ? 'Province' : 'District'}
          </h4>
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(300, water.length * 18)}>
            <BarChart data={water} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[60, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[50, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Urban" fill="#00A1DE" barSize={isProvince ? 18 : 8} />
              <Bar dataKey="Rural" fill="#20603D" barSize={isProvince ? 18 : 8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mobile phone */}
      {mobile.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">
            Households with Mobile Phone — {isProvince ? 'Province' : 'District'}
          </h4>
          <ResponsiveContainer width="100%" height={isProvince ? 200 : Math.max(300, mobile.length * 18)}>
            <BarChart data={mobile} layout={isProvince ? 'horizontal' : 'vertical'}
              margin={{ top: 0, right: 16, left: isProvince ? 0 : 64, bottom: isProvince ? 36 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              {isProvince ? (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[60, 100]} tickFormatter={(v) => `${v}%`} />
                </>
              ) : (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={62} />
                </>
              )}
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Urban" fill="#7C3AED" barSize={isProvince ? 18 : 8} />
              <Bar dataKey="Rural" fill="#94A3B8" barSize={isProvince ? 18 : 8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Population ────────────────────────────────────────────────────────────────
function PopulationPanel({ data, level }: { data: any; level: string }) {
  const disability = (data.disability ?? []).map((r: any) => ({
    name: shortName(r.name),
    'Disability %': parseFloat(r.disability_pct) || 0,
  }));

  const disTypes = (data.disability_types ?? []).filter((r: any) => r.pct_both != null).map((r: any) => ({
    type: r.type?.replace('Short stature disability', 'Short Stature').replace('Albinism disability', 'Albinism') || '',
    'Both': parseFloat(r.pct_both) || 0,
    'Male': parseFloat(r.pct_male) || 0,
    'Female': parseFloat(r.pct_female) || 0,
  })).filter((r: any) => r.Both > 0);

  const ageGroups = (data.age_groups ?? []).map((r: any) => ({
    group: r.age_group,
    count: r.count,
  }));

  const isProvince = level === 'province';

  return (
    <div className="space-y-4">
      {/* Dependency ratio card */}
      {data.dependency_ratio != null && (
        <div className="bg-white rounded-xl border border-light-gray p-4 flex gap-6 items-center">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-rwanda-blue">{data.dependency_ratio}%</div>
            <div className="text-xs font-semibold text-dark-gray mt-1">Dependency Ratio</div>
            <div className="text-[10px] text-medium-gray">(0–14 + 65+) / (15–64) × 100</div>
          </div>
          <div className="flex-1 text-xs text-dark-gray border-l border-light-gray pl-4">
            <p className="font-semibold text-rich-black mb-1">What this means</p>
            <p>For every 100 working-age adults, there are {data.dependency_ratio} dependants (children + elderly). Higher ratios signal greater need for social safety nets, childcare, and elder services.</p>
          </div>
        </div>
      )}

      {/* Age pyramid (horizontal bars) */}
      {ageGroups.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">Age Distribution — National (2022)</h4>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ageGroups} layout="vertical" margin={{ top: 0, right: 40, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }}
                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`} />
              <YAxis dataKey="group" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={36} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [v.toLocaleString(), 'Population']} />
              <Bar dataKey="count" fill="#00A1DE" barSize={12} radius={[0, 3, 3, 0]}
                label={false}>
                {ageGroups.map((_: any, i: number) => (
                  <Cell key={i} fill={i < 3 ? '#60a5fa' : i >= 13 ? '#f97316' : '#00A1DE'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-2 text-[10px] text-medium-gray">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-400" />0–14 (youth)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#00A1DE]" />15–64 (working age)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-orange-400" />65+ (elderly)</span>
          </div>
        </div>
      )}

      {/* Disability prevalence */}
      {disability.length > 0 && (
        <HBarChart
          data={disability}
          dataKey="Disability %"
          label={`Disability Prevalence (%) — ${isProvince ? 'Province' : 'District'}`}
          color="#7C3AED"
          domain={[0, 6]}
          formatter={(v) => `${v}%`}
        />
      )}

      {/* Disability by type */}
      {disTypes.length > 0 && (
        <div className="bg-white rounded-xl border border-light-gray p-4">
          <h4 className="text-xs font-semibold text-rich-black mb-3 uppercase tracking-wider">Disability Prevalence by Type — National (%)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={disTypes} layout="vertical" margin={{ top: 0, right: 16, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={96} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Male" fill="#00A1DE" barSize={8} />
              <Bar dataKey="Female" fill="#EC4899" barSize={8} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SectorPanel({ sector, data, level }: Props) {
  if (!data) return null;

  switch (sector) {
    case 'population':  return <PopulationPanel data={data} level={level} />;
    case 'education':   return <EducationPanel data={data} level={level} />;
    case 'health':      return <HealthPanel data={data} level={level} />;
    case 'agriculture': return <AgriculturePanel data={data} level={level} />;
    case 'households':  return <HouseholdsPanel data={data} level={level} />;
    default:            return null;
  }
}
