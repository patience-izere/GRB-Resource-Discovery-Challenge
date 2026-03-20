import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, BookOpen, Database, Link, FileText } from 'lucide-react';

const STORAGE_KEY = 'ddr_consent_accepted';

interface Props {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WelcomeConsent({ forceOpen, onClose }: Props = {}) {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  // When forced open externally, show and reset checkbox
  useEffect(() => {
    if (forceOpen) { setVisible(true); setAgreed(false); }
  }, [forceOpen]);

  function handleClose() {
    setVisible(false);
    onClose?.();
  }

  function handleEnter() {
    if (!agreed) return;
    localStorage.setItem(STORAGE_KEY, 'true');
    handleClose();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-rwanda-blue px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-white font-display font-bold text-xl leading-tight">
                Welcome to Data Discovery Rw
              </h1>
              <p className="text-blue-100 text-sm mt-1 leading-snug">
                Your Gateway to Fact-Checked Rwandan Evidence
              </p>
            </div>
            <img
              src="/logo.png"
              alt="Data Discovery Rw"
              className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1 shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-sm text-dark-gray">

          {/* About */}
          <p className="text-soft-black leading-relaxed">
            <span className="font-semibold text-rich-black">Data Discovery Rw</span> is a specialized
            repository designed to empower Civil Society Organizations (CSOs) and Policy Makers with
            expert, fact-checked data from official Rwandan publications. Our platform simplifies your
            interventions by providing a centralized directory of data from both governmental entities
            and the private sector.
          </p>

          {/* What we provide */}
          <div>
            <p className="font-semibold text-rich-black mb-2">What we provide:</p>
            <ul className="space-y-2">
              {[
                { icon: <ShieldCheck className="w-4 h-4 text-rwanda-blue shrink-0 mt-0.5" />, title: 'Expert Curation', desc: 'Access to official reports, datasets, and specialized studies.' },
                { icon: <Database className="w-4 h-4 text-rwanda-blue shrink-0 mt-0.5" />, title: 'Quality Assurance', desc: 'Metadata and data quality info for every resource.' },
                { icon: <Link className="w-4 h-4 text-rwanda-blue shrink-0 mt-0.5" />, title: 'Guided Access', desc: 'Direct links to public data and secure portals for restricted repositories.' },
                { icon: <BookOpen className="w-4 h-4 text-rwanda-blue shrink-0 mt-0.5" />, title: 'Resource Library', desc: 'Accompanying research papers and methodology docs.' },
              ].map(item => (
                <li key={item.title} className="flex items-start gap-2.5">
                  {item.icon}
                  <span><span className="font-semibold text-rich-black">{item.title}:</span> {item.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy notice */}
          <div className="bg-off-white border border-light-gray rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-rwanda-green shrink-0" />
              <span className="font-semibold text-rich-black text-sm">Data Protection & Privacy Consent</span>
            </div>
            <p className="text-xs text-dark-gray leading-relaxed">
              In compliance with Rwanda's <span className="font-medium text-rich-black">Law Nº 058/2021</span> relating
              to the Protection of Personal Data and Privacy, we are committed to safeguarding your information.
              By using this platform, you acknowledge that:
            </p>
            <ul className="text-xs text-dark-gray space-y-1.5 list-none">
              {[
                'We may collect minimal interaction data to improve our services for the development sector.',
                'Some datasets are hosted on third-party governmental/private portals; your access to those is subject to their respective privacy terms.',
                'You have the right to access, rectify, or request the deletion of any personal data we may hold.',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rwanda-blue font-bold mt-0.5">·</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-light-gray accent-rwanda-blue cursor-pointer shrink-0"
            />
            <span className="text-sm text-dark-gray leading-snug group-hover:text-rich-black transition-colors">
              I have read and agree to the{' '}
              <span className="text-rwanda-blue font-medium">Data Privacy Terms</span> and the use
              of this platform for evidence-based intervention.
            </span>
          </label>
        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 border-t border-light-gray bg-off-white shrink-0 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleEnter}
              disabled={!agreed}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                agreed
                  ? 'bg-rwanda-blue text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-light-gray text-medium-gray cursor-not-allowed'
              }`}
            >
              Enter Platform
            </button>
            <a
              href="https://www.datadiscovery.rw/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-light-gray bg-white text-dark-gray hover:border-rwanda-blue hover:text-rwanda-blue transition-colors text-center"
            >
              Read Our Full Privacy Policy
            </a>
          </div>
          <p className="text-[11px] text-medium-gray text-center">
            To learn more about our mission and methodologies, visit{' '}
            <a
              href="https://www.datadiscovery.rw/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rwanda-blue hover:underline"
            >
              www.datadiscovery.rw/about
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
