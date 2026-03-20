import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

interface Section {
  id: string;
  label: string;
}

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (title: string, date: string, selectedSections: string[]) => void;
  defaultTitle: string;
  sections: Section[];
}

export default function PdfExportModal({ isOpen, onClose, onExport, defaultTitle, sections }: PdfExportModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSections, setSelectedSections] = useState<string[]>(sections.map(s => s.id));

  if (!isOpen) return null;

  const handleToggleSection = (id: string) => {
    setSelectedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    onExport(title, date, selectedSections);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-light-gray">
          <h3 className="text-lg font-display font-semibold text-rich-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-rwanda-blue" />
            Export PDF Report
          </h3>
          <button onClick={onClose} className="text-medium-gray hover:text-dark-gray">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-rich-black mb-1">Report Title</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-light-gray rounded-lg p-2.5 text-sm focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-rich-black mb-1">Report Date</label>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-light-gray rounded-lg p-2.5 text-sm focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-rich-black mb-2">Include Sections</label>
            <div className="space-y-2">
              {sections.map(section => (
                <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedSections.includes(section.id)}
                    onChange={() => handleToggleSection(section.id)}
                    className="w-4 h-4 text-rwanda-blue rounded border-light-gray focus:ring-rwanda-blue"
                  />
                  <span className="text-sm text-dark-gray">{section.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-light-gray flex justify-end gap-2 bg-off-white">
          <button onClick={onClose} className="btn-ghost py-2 px-4 text-sm">Cancel</button>
          <button 
            onClick={handleExport} 
            disabled={selectedSections.length === 0 || !title.trim()}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
