import React from 'react';
import DataExplorer from '../components/DataExplorer';
import { useDistricts } from '../context/DistrictContext';

export default function DataExplorerPage() {
  const { selectedDistricts } = useDistricts();

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">Data Explorer</h1>
        <p className="text-dark-gray text-sm">
          {selectedDistricts.length > 0 ? `Data for ${selectedDistricts.length} district${selectedDistricts.length !== 1 ? 's' : ''} — ` : ''}Browse, filter, and analyze gender indicators in depth.
        </p>
      </div>
      <DataExplorer />
    </div>
  );
}
