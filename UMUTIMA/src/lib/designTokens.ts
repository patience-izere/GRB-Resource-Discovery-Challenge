export const domainColors = {
  economic: '#FAD201', // Rwanda Yellow
  health: '#00A1DE', // Rwanda Blue
  education: '#20603D', // Rwanda Green
  leadership: '#E5BE01', // Rwanda Gold
  crossCutting: '#1A1A1A', // Rich Black
  finance: '#7C3AED', // Purple — Finance & Budgeting
};

export function useDomainColor(domain: keyof typeof domainColors) {
  return domainColors[domain] || domainColors.crossCutting;
}
