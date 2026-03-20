import React, { createContext, useContext, useState, ReactNode } from 'react';

const DISTRICTS = [
  // Kigali
  { id: 'gasabo', name: 'Gasabo', province: 'Kigali' },
  { id: 'nyarugenge', name: 'Nyarugenge', province: 'Kigali' },
  { id: 'kicukiro', name: 'Kicukiro', province: 'Kigali' },
  // Northern
  { id: 'burera', name: 'Burera', province: 'Northern' },
  { id: 'musanze', name: 'Musanze', province: 'Northern' },
  { id: 'gakenke', name: 'Gakenke', province: 'Northern' },
  { id: 'gicumbi', name: 'Gicumbi', province: 'Northern' },
  { id: 'rulindo', name: 'Rulindo', province: 'Northern' },
  // Eastern
  { id: 'nyagatare', name: 'Nyagatare', province: 'Eastern' },
  { id: 'gatsibo', name: 'Gatsibo', province: 'Eastern' },
  { id: 'kayonza', name: 'Kayonza', province: 'Eastern' },
  { id: 'rwamagana', name: 'Rwamagana', province: 'Eastern' },
  { id: 'kirehe', name: 'Kirehe', province: 'Eastern' },
  { id: 'ngoma', name: 'Ngoma', province: 'Eastern' },
  { id: 'bugesera', name: 'Bugesera', province: 'Eastern' },
  // Southern
  { id: 'kamonyi', name: 'Kamonyi', province: 'Southern' },
  { id: 'muhanga', name: 'Muhanga', province: 'Southern' },
  { id: 'ruhango', name: 'Ruhango', province: 'Southern' },
  { id: 'nyanza', name: 'Nyanza', province: 'Southern' },
  { id: 'huye', name: 'Huye', province: 'Southern' },
  { id: 'nyamagabe', name: 'Nyamagabe', province: 'Southern' },
  { id: 'gisagara', name: 'Gisagara', province: 'Southern' },
  { id: 'nyaruguru', name: 'Nyaruguru', province: 'Southern' },
  // Western
  { id: 'rubavu', name: 'Rubavu', province: 'Western' },
  { id: 'nyabihu', name: 'Nyabihu', province: 'Western' },
  { id: 'ngororero', name: 'Ngororero', province: 'Western' },
  { id: 'rutsiro', name: 'Rutsiro', province: 'Western' },
  { id: 'karongi', name: 'Karongi', province: 'Western' },
  { id: 'nyamasheke', name: 'Nyamasheke', province: 'Western' },
  { id: 'rusizi', name: 'Rusizi', province: 'Western' },
];

export interface District {
  id: string;
  name: string;
  province: string;
}

interface DistrictContextType {
  selectedDistricts: string[];
  allDistricts: District[];
  addDistrict: (id: string) => void;
  removeDistrict: (id: string) => void;
  toggleDistrict: (id: string) => void;
  clearDistricts: () => void;
  isSelected: (id: string) => boolean;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  const addDistrict = (id: string) => {
    setSelectedDistricts(prev => 
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  const removeDistrict = (id: string) => {
    setSelectedDistricts(prev => prev.filter(d => d !== id));
  };

  const toggleDistrict = (id: string) => {
    setSelectedDistricts(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  const clearDistricts = () => {
    setSelectedDistricts([]);
  };

  const isSelected = (id: string) => selectedDistricts.includes(id);

  return (
    <DistrictContext.Provider 
      value={{ 
        selectedDistricts, 
        allDistricts: DISTRICTS,
        addDistrict,
        removeDistrict,
        toggleDistrict,
        clearDistricts,
        isSelected,
      }}
    >
      {children}
    </DistrictContext.Provider>
  );
}

export function useDistricts() {
  const context = useContext(DistrictContext);
  if (context === undefined) {
    throw new Error('useDistricts must be used within DistrictProvider');
  }
  return context;
}
