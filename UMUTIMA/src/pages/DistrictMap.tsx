import React from 'react';
import RwandaMap from '../components/RwandaMap';
import { useDistricts } from '../context/DistrictContext';

export default function DistrictMap() {
  const { selectedDistricts } = useDistricts();

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-3">
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black">District Map</h1>
        <p className="text-dark-gray text-sm">
          {selectedDistricts.length > 0 ? `Viewing ${selectedDistricts.length} district${selectedDistricts.length !== 1 ? 's' : ''} — ` : ''}Gender data coverage and indicators by district across Rwanda.
        </p>
      </div>
      <div className="h-[560px]">
        <RwandaMap />
      </div>
    </div>
  );
}
