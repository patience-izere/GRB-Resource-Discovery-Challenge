import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useDistricts } from '../context/DistrictContext';

export default function DistrictFilter() {
  const { selectedDistricts, allDistricts, toggleDistrict, clearDistricts, isSelected } = useDistricts();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Group districts by province
  const groupedByProvince = allDistricts.reduce((acc, district) => {
    if (!acc[district.province]) {
      acc[district.province] = [];
    }
    acc[district.province].push(district);
    return acc;
  }, {} as Record<string, typeof allDistricts>);

  const filteredGroups = Object.entries(groupedByProvince).reduce((acc, [province, districts]) => {
    const filtered = districts.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[province] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof allDistricts>);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white text-sm font-medium"
      >
        <span>District{selectedDistricts.length > 0 ? ` (${selectedDistricts.length})` : ''}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-light-gray z-50">
          {/* Search */}
          <div className="p-3 border-b border-light-gray">
            <input
              type="text"
              placeholder="Search districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rwanda-blue"
            />
          </div>

          {/* Clear button */}
          {selectedDistricts.length > 0 && (
            <div className="px-3 py-2 border-b border-light-gray">
              <button
                onClick={() => {
                  clearDistricts();
                  setSearchTerm('');
                }}
                className="text-sm text-rwanda-blue hover:underline font-medium"
              >
                Clear all ({selectedDistricts.length} selected)
              </button>
            </div>
          )}

          {/* District list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {Object.entries(filteredGroups).length === 0 ? (
              <div className="px-3 py-4 text-center text-dark-gray text-sm">
                No districts found
              </div>
            ) : (
              Object.entries(filteredGroups).map(([province, districts]) => (
                <div key={province}>
                  <div className="px-3 py-2 text-xs font-bold text-dark-gray uppercase bg-off-white rounded mt-2 first:mt-0">
                    {province} Province
                  </div>
                  {districts.map((district) => (
                    <label
                      key={district.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-off-white rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(district.id)}
                        onChange={() => toggleDistrict(district.id)}
                        className="w-4 h-4 rounded border-light-gray cursor-pointer accent-rwanda-blue"
                      />
                      <span className="text-sm text-rich-black flex-1">{district.name}</span>
                    </label>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer info */}
          {selectedDistricts.length > 0 && (
            <div className="px-3 py-2 border-t border-light-gray text-xs text-dark-gray text-center">
              {selectedDistricts.length} district{selectedDistricts.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
