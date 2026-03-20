/**
 * Utility functions for filtering data by selected districts
 */

export const PROVINCE_DISTRICTS: Record<string, string[]> = {
  Kigali:   ['gasabo', 'nyarugenge', 'kicukiro'],
  Northern: ['burera', 'musanze', 'gakenke', 'gicumbi', 'rulindo'],
  Eastern:  ['nyagatare', 'gatsibo', 'kayonza', 'rwamagana', 'kirehe', 'ngoma', 'bugesera'],
  Southern: ['kamonyi', 'muhanga', 'ruhango', 'nyanza', 'huye', 'nyamagabe', 'gisagara', 'nyaruguru'],
  Western:  ['rubavu', 'nyabihu', 'ngororero', 'rutsiro', 'karongi', 'nyamasheke', 'rusizi'],
};

export const ALL_DISTRICT_IDS: string[] = Object.values(PROVINCE_DISTRICTS).flat();

export interface DistrictFilterable {
  affectedDistricts?: number;
  districts?: string[];
  regionalData?: Array<{ district: string; value: number }>;
  location?: string;
}

/**
 * Convert a geographic_scope string (e.g. "Western Province", "National") to district IDs.
 * Returns [] for unresolvable scopes — callers should treat [] as "show always".
 */
export function geographicScopeToDistrictIds(scope: string): string[] {
  if (!scope) return [];
  const s = scope.toLowerCase();

  if (s.includes('national') || s.includes('all 30') || s.includes('all districts')) {
    return ALL_DISTRICT_IDS;
  }

  const matched: string[] = [];
  for (const [province, ids] of Object.entries(PROVINCE_DISTRICTS)) {
    if (s.includes(province.toLowerCase())) matched.push(...ids);
  }
  if (matched.length) return [...new Set(matched)];

  for (const id of ALL_DISTRICT_IDS) {
    if (s.includes(id)) return [id];
  }

  return []; // international / unresolvable scope
}

/**
 * Filter studies/records by selected districts
 * Returns data filtered by district if districts are selected, otherwise returns all data
 */
export function filterByDistricts<T extends any>(
  data: T[],
  selectedDistricts: string[],
  getDistrictId: (item: T) => string | undefined
): T[] {
  if (selectedDistricts.length === 0) {
    return data;
  }
  return data.filter(item => {
    const districtId = getDistrictId(item);
    return districtId && selectedDistricts.includes(districtId);
  });
}

/**
 * Filter regional data by selected districts
 */
export function filterRegionalData(
  data: Array<{ district: string; value: number }>,
  selectedDistricts: string[]
): Array<{ district: string; value: number }> {
  if (selectedDistricts.length === 0) {
    return data;
  }
  return data.filter(item =>
    selectedDistricts.some(sd =>
      item.district.toLowerCase().includes(sd) || sd.includes(item.district.toLowerCase())
    )
  );
}

/**
 * Check if a gap's district IDs intersect with the selected districts.
 * Returns true when no filter is active or when the gap has no specific district mapping.
 */
export function doesGapAffectSelectedDistricts(
  gapDistrictIds: string[],
  selectedDistricts: string[]
): boolean {
  if (selectedDistricts.length === 0) return true;
  if (gapDistrictIds.length === 0) return true; // national/unknown → always show
  return gapDistrictIds.some(id => selectedDistricts.includes(id));
}

/**
 * Calculate the percentage of selected districts covered by a gap.
 */
export function calculateGapCoverageForDistricts(
  gapDistrictIds: string[],
  selectedDistricts: string[]
): number {
  if (!selectedDistricts.length || !gapDistrictIds.length) return 0;
  const matched = gapDistrictIds.filter(id => selectedDistricts.includes(id));
  return Math.round((matched.length / selectedDistricts.length) * 100);
}

/**
 * Get display text for current district filter
 */
export function getDistrictFilterLabel(
  selectedDistricts: string[],
  allDistricts: Array<{ id: string; name: string }>
): string {
  if (selectedDistricts.length === 0) {
    return 'All Districts';
  }
  if (selectedDistricts.length === 1) {
    const district = allDistricts.find(d => d.id === selectedDistricts[0]);
    return district?.name || 'Unknown District';
  }
  return `${selectedDistricts.length} Districts Selected`;
}
