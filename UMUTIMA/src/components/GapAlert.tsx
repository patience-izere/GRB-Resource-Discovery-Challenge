import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { domainColors } from '../lib/designTokens';

interface Props {
  key?: React.Key;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export default function GapAlert({ title, description, severity }: Props) {
  const isCritical = severity === 'critical';
  const borderColor = isCritical ? domainColors.leadership : domainColors.economic; // Gold for critical, Yellow for warning
  const iconColor = isCritical ? domainColors.leadership : domainColors.economic;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden">
      <div className="border-l-4 p-5 flex items-start gap-4" style={{ borderLeftColor: borderColor }}>
        <div className="mt-0.5" style={{ color: iconColor }}>
          {isCritical ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-rich-black mb-1">{title}</h4>
          <p className="text-sm text-dark-gray mb-4">{description}</p>
          <button className="btn-accent text-sm px-4 py-2">
            Generate Advocacy Brief
          </button>
        </div>
      </div>
    </div>
  );
}
