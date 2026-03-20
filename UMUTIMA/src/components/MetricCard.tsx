import React from 'react';
import { domainColors } from '../lib/designTokens';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  key?: React.Key;
  domain: keyof typeof domainColors;
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  chartData?: any[];
}

export default function MetricCard({ domain, title, value, trend, trendDirection, chartData }: Props) {
  const color = domainColors[domain];

  return (
    <div className="metric-card group flex flex-col h-full !p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-xs font-semibold text-dark-gray uppercase tracking-wider">{title}</h3>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendDirection === 'down' && domain !== 'health' ? '#E53E3E' : color }}>
          {trendDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
          {trendDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
          {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          {trend}
        </div>
      </div>

      {chartData && chartData.length > 0 && (
        <div className="h-10 mt-auto w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
