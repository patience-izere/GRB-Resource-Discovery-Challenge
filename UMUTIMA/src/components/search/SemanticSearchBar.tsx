import React, { useState, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export interface SearchResult {
  source: string;
  score: number;
  data: Record<string, string | number>;
}

interface Props {
  onResults: (results: SearchResult[]) => void;
  sources?: string[];
  placeholder?: string;
}

export function SemanticSearchBar({ onResults, sources, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { onResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, top_k: '20' });
      if (sources?.length) params.set('sources', sources.join(','));
      const res = await fetch(`/api/search/?${params}`);
      const json = await res.json();
      onResults(json.results ?? []);
    } finally {
      setLoading(false);
    }
  }, [sources, onResults]);

  React.useEffect(() => { runSearch(debouncedQuery); }, [debouncedQuery, runSearch]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Search studies, indicators, metrics...'}
        className="w-full rounded-xl border border-light-gray px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-medium-gray">searching...</span>
      )}
    </div>
  );
}
