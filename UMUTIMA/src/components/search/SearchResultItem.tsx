import React from 'react';
import type { SearchResult } from './SemanticSearchBar';

const SOURCE_LABELS: Record<string, string> = {
  studies: 'Study',
  metrics: 'Metric',
  indicators: 'Indicator',
  insights: 'Insight',
  gap_alerts: 'Gap Alert',
  census: 'Census',
};

interface Props {
  result: SearchResult;
}

export function SearchResultItem({ result }: Props) {
  const { source, score, data } = result;
  const title = (data.title ?? data.headline ?? data.name ?? '') as string;
  const subtitle = (data.abstract ?? data.description ?? '') as string;
  const meta = source === 'census'
    ? `${data.geo_name}${data.geo_type ? ` · ${data.geo_type}` : ''}`
    : (data.domain ?? data.severity ?? '') as string;

  return (
    <div className="bg-white border border-light-gray rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-medium-gray">
          {SOURCE_LABELS[source] ?? source}
          {meta ? ` · ${meta}` : ''}
        </span>
        <span className="text-[10px] text-medium-gray">{(score * 100).toFixed(0)}% match</span>
      </div>
      <p className="text-sm font-semibold text-rich-black">{title}</p>
      {subtitle && (
        <p className="text-xs text-medium-gray mt-1 line-clamp-2">{subtitle}</p>
      )}
    </div>
  );
}
