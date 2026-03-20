import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Info, Menu } from 'lucide-react';
import DistrictFilter from './DistrictFilter';
import { SearchResultItem } from './search/SearchResultItem';
import type { SearchResult } from './search/SemanticSearchBar';
import { useDebounce } from '../hooks/useDebounce';

interface Props {
  onMenuToggle: () => void;
  onInfoClick: () => void;
}

export default function Header({ onMenuToggle, onInfoClick }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}&top_k=10`);
      const json = await res.json();
      const hits: SearchResult[] = json.results ?? [];
      setResults(hits);
      setOpen(hits.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runSearch(debouncedQuery); }, [debouncedQuery, runSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-rwanda-blue text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search box */}
        <div ref={containerRef} className="relative w-full max-w-md hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search gender data, indicators, or reports..."
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/70 focus:outline-none focus:bg-white/20 transition-colors"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/60">
              searching…
            </span>
          )}

          {/* Results dropdown */}
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[420px] overflow-y-auto z-50">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {results.length} results for "{query}"
              </p>
              <div className="flex flex-col gap-1 px-2 pb-2">
                {results.map((r, i) => (
                  <SearchResultItem key={`${r.source}-${r.data.id ?? i}`} result={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DistrictFilter />
        <button
          onClick={onInfoClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="About & Privacy"
          title="About & Privacy Policy"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
