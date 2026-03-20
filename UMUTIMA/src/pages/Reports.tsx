import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

type FormState = {
  // Section 1
  fullName: string;
  email: string;
  role: string;
  github: string;
  // Section 2
  datasetTitle: string;
  sector: string;
  sectorOther: string;
  geoCoverage: string;
  timePeriod: string;
  dataFormat: string;
  // Section 3
  primarySource: string;
  methodology: string;
  limitations: string;
  peerReviewed: 'yes' | 'no' | '';
  citation: string;
  // Section 4
  accessLevel: 'public' | 'external' | 'restricted' | '';
  externalLink: string;
  license: string;
  // Section 5
  hasPII: 'no' | 'yes' | '';
  consentCertified: boolean;
  // Section 6
  datasetLink: string;
  notes: string;
};

const INITIAL: FormState = {
  fullName: '', email: '', role: '', github: '',
  datasetTitle: '', sector: '', sectorOther: '', geoCoverage: '', timePeriod: '', dataFormat: '',
  primarySource: '', methodology: '', limitations: '', peerReviewed: '', citation: '',
  accessLevel: '', externalLink: '', license: '',
  hasPII: '', consentCertified: false,
  datasetLink: '', notes: '',
};

const SECTORS = ['Population', 'Education', 'Health', 'Agriculture', 'Household', 'Other'];

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-rwanda-blue text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </span>
      <div>
        <h2 className="text-sm font-display font-semibold text-rich-black">{title}</h2>
        {subtitle && <p className="text-xs text-dark-gray mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-rich-black">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-[11px] text-medium-gray">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full text-sm border border-light-gray rounded-lg px-3 py-2 bg-white text-rich-black placeholder:text-medium-gray focus:outline-none focus:border-rwanda-blue focus:ring-1 focus:ring-rwanda-blue/30 transition';
const textareaCls = inputCls + ' resize-none';

export default function Reports() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set(key: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.role.trim()) e.role = 'Required';
    if (!form.datasetTitle.trim()) e.datasetTitle = 'Required';
    if (!form.sector) e.sector = 'Select a sector';
    if (form.sector === 'Other' && !form.sectorOther.trim()) e.sectorOther = 'Please specify';
    if (!form.geoCoverage.trim()) e.geoCoverage = 'Required';
    if (!form.timePeriod.trim()) e.timePeriod = 'Required';
    if (!form.dataFormat.trim()) e.dataFormat = 'Required';
    if (!form.primarySource.trim()) e.primarySource = 'Required';
    if (!form.methodology.trim()) e.methodology = 'Required';
    if (!form.peerReviewed) e.peerReviewed = 'Please select one';
    if (form.peerReviewed === 'yes' && !form.citation.trim()) e.citation = 'Please provide citation';
    if (!form.accessLevel) e.accessLevel = 'Please select one';
    if (form.accessLevel === 'external' && !form.externalLink.trim()) e.externalLink = 'Required for external portal';
    if (!form.hasPII) e.hasPII = 'Please select one';
    if (!form.consentCertified) e.consentCertified = 'You must certify this to submit';
    if (!form.datasetLink.trim()) e.datasetLink = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // In production this would POST to an API
    console.log('Dataset submission:', form);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-light-gray p-10 flex flex-col items-center text-center gap-4 mt-8">
          <CheckCircle className="w-14 h-14 text-rwanda-green" />
          <div>
            <h2 className="text-xl font-display font-bold text-rich-black">Submission Received!</h2>
            <p className="text-dark-gray text-sm mt-2 max-w-sm">
              Thank you for contributing to Rwanda's open data ecosystem. Our expert team will review,
              fact-check, and validate your dataset before publishing it in the directory.
            </p>
          </div>
          <p className="text-xs text-medium-gray">You will be contacted at <span className="font-medium text-dark-gray">{form.email}</span> with updates.</p>
          <button
            onClick={() => { setForm(INITIAL); setSubmitted(false); }}
            className="mt-2 px-6 py-2.5 bg-rwanda-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Submit Another Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">

      {/* Page header */}
      <div>
        <h1 className="text-lg font-display font-bold text-rich-black flex items-center gap-2">
          <Upload className="w-5 h-5 text-rwanda-blue" />
          Data Contribution
        </h1>
        <p className="text-dark-gray text-sm mt-0.5">
          Dataset Contribution Form — <span className="font-medium text-rwanda-blue">Data Discovery Rw</span>
        </p>
      </div>

      {/* Intro banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        Thank you for contributing to Rwanda's open data ecosystem. Use this form to submit a dataset
        for review. Our expert team will fact-check the metadata and quality before it is published
        in the directory.
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ── Section 1: Contributor Info ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader number="1" title="Contributor Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name / Organization Name" required>
              <input className={inputCls} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g., Rwanda Red Cross" />
              {errors.fullName && <p className="text-[11px] text-red-500 mt-0.5">{errors.fullName}</p>}
            </Field>
            <Field label="Contact Email" required>
              <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@org.rw" />
              {errors.email && <p className="text-[11px] text-red-500 mt-0.5">{errors.email}</p>}
            </Field>
            <Field label="Role / Affiliation" required hint="e.g., Independent Researcher, NGO, Private Sector Data Lead">
              <input className={inputCls} value={form.role} onChange={e => set('role', e.target.value)} placeholder="Your role or affiliation" />
              {errors.role && <p className="text-[11px] text-red-500 mt-0.5">{errors.role}</p>}
            </Field>
            <Field label="GitHub / Portfolio Link" hint="Optional">
              <input className={inputCls} value={form.github} onChange={e => set('github', e.target.value)} placeholder="https://github.com/…" />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Dataset Metadata ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader number="2" title="Dataset Metadata" />
          <Field label="Dataset Title" required hint='e.g., "Kigali Urban Transit Frequencies 2024"'>
            <input className={inputCls} value={form.datasetTitle} onChange={e => set('datasetTitle', e.target.value)} placeholder="Descriptive dataset title" />
            {errors.datasetTitle && <p className="text-[11px] text-red-500 mt-0.5">{errors.datasetTitle}</p>}
          </Field>

          <Field label="Sector" required>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => set('sector', s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.sector === s
                      ? 'bg-rwanda-blue text-white border-rwanda-blue'
                      : 'bg-white text-dark-gray border-light-gray hover:border-rwanda-blue hover:text-rwanda-blue'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.sector && <p className="text-[11px] text-red-500 mt-0.5">{errors.sector}</p>}
            {form.sector === 'Other' && (
              <div className="mt-2">
                <input className={inputCls} value={form.sectorOther} onChange={e => set('sectorOther', e.target.value)} placeholder="Please specify sector" />
                {errors.sectorOther && <p className="text-[11px] text-red-500 mt-0.5">{errors.sectorOther}</p>}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Geographic Coverage" required hint="e.g., National, District-level, specific Ward">
              <input className={inputCls} value={form.geoCoverage} onChange={e => set('geoCoverage', e.target.value)} placeholder="Geographic scope" />
              {errors.geoCoverage && <p className="text-[11px] text-red-500 mt-0.5">{errors.geoCoverage}</p>}
            </Field>
            <Field label="Time Period" required hint="Start Date to End Date of data collection">
              <input className={inputCls} value={form.timePeriod} onChange={e => set('timePeriod', e.target.value)} placeholder="e.g., Jan 2022 – Dec 2023" />
              {errors.timePeriod && <p className="text-[11px] text-red-500 mt-0.5">{errors.timePeriod}</p>}
            </Field>
          </div>

          <Field label="Data Format" required hint="e.g., CSV, JSON, GeoJSON, Excel, API Link">
            <input className={inputCls} value={form.dataFormat} onChange={e => set('dataFormat', e.target.value)} placeholder="File type(s)" />
            {errors.dataFormat && <p className="text-[11px] text-red-500 mt-0.5">{errors.dataFormat}</p>}
          </Field>
        </div>

        {/* ── Section 3: Data Source & Quality ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader number="3" title="Data Source & Quality" />
          <Field label="Primary Source" required hint="Where did this data come from? Provide original publication links if available.">
            <textarea className={textareaCls} rows={2} value={form.primarySource} onChange={e => set('primarySource', e.target.value)} placeholder="Original source or publication link" />
            {errors.primarySource && <p className="text-[11px] text-red-500 mt-0.5">{errors.primarySource}</p>}
          </Field>
          <Field label="Collection Methodology" required hint="Briefly describe how this data was gathered.">
            <textarea className={textareaCls} rows={2} value={form.methodology} onChange={e => set('methodology', e.target.value)} placeholder="Survey, administrative records, sensor data…" />
            {errors.methodology && <p className="text-[11px] text-red-500 mt-0.5">{errors.methodology}</p>}
          </Field>
          <Field label="Known Limitations" hint="Missing values, biases, or specific conditions users should know about.">
            <textarea className={textareaCls} rows={2} value={form.limitations} onChange={e => set('limitations', e.target.value)} placeholder="Optional but encouraged" />
          </Field>

          <Field label="Fact-Check Status" required hint="Has this been peer-reviewed or published by a governmental/recognized body?">
            <div className="space-y-2">
              {[
                { val: 'yes', label: 'Yes — peer-reviewed or officially published' },
                { val: 'no', label: 'No — will undergo our internal validation' },
              ].map(opt => (
                <label key={opt.val} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="peerReviewed" value={opt.val}
                    checked={form.peerReviewed === opt.val}
                    onChange={() => set('peerReviewed', opt.val)}
                    className="accent-rwanda-blue" />
                  <span className="text-sm text-dark-gray">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.peerReviewed && <p className="text-[11px] text-red-500 mt-0.5">{errors.peerReviewed}</p>}
            {form.peerReviewed === 'yes' && (
              <div className="mt-2">
                <input className={inputCls} value={form.citation} onChange={e => set('citation', e.target.value)} placeholder="Full citation or URL" />
                {errors.citation && <p className="text-[11px] text-red-500 mt-0.5">{errors.citation}</p>}
              </div>
            )}
          </Field>
        </div>

        {/* ── Section 4: Access & Licensing ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader number="4" title="Access & Licensing" />
          <Field label="Access Level" required>
            <div className="space-y-2">
              {[
                { val: 'public', label: 'Public', desc: 'Open for immediate download.' },
                { val: 'external', label: 'External Portal', desc: 'Requires login on a third-party site.' },
                { val: 'restricted', label: 'Restricted', desc: 'Available upon request to the owner.' },
              ].map(opt => (
                <label key={opt.val} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="accessLevel" value={opt.val}
                    checked={form.accessLevel === opt.val}
                    onChange={() => set('accessLevel', opt.val)}
                    className="accent-rwanda-blue mt-0.5" />
                  <span className="text-sm text-dark-gray">
                    <span className="font-semibold text-rich-black">{opt.label}:</span> {opt.desc}
                  </span>
                </label>
              ))}
            </div>
            {errors.accessLevel && <p className="text-[11px] text-red-500 mt-0.5">{errors.accessLevel}</p>}
            {form.accessLevel === 'external' && (
              <div className="mt-2">
                <input className={inputCls} value={form.externalLink} onChange={e => set('externalLink', e.target.value)} placeholder="https://portal.example.rw/…" />
                {errors.externalLink && <p className="text-[11px] text-red-500 mt-0.5">{errors.externalLink}</p>}
              </div>
            )}
          </Field>

          <Field label="License" hint="e.g., Creative Commons CC-BY 4.0, Open Government License, Custom">
            <input className={inputCls} value={form.license} onChange={e => set('license', e.target.value)} placeholder="License type" />
          </Field>
        </div>

        {/* ── Section 5: Privacy & Legal ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader
            number="5"
            title="Privacy & Legal Compliance"
            subtitle="Rwanda Law Nº 058/2021 — Protection of Personal Data and Privacy"
          />

          <Field label="Anonymization" required hint="Does this dataset contain any Personal Identifiable Information (PII)?">
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="hasPII" value="no"
                  checked={form.hasPII === 'no'}
                  onChange={() => set('hasPII', 'no')}
                  className="accent-rwanda-blue" />
                <span className="text-sm text-dark-gray">No, the data is fully anonymized / aggregated.</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="radio" name="hasPII" value="yes"
                  checked={form.hasPII === 'yes'}
                  onChange={() => set('hasPII', 'yes')}
                  className="accent-rwanda-blue mt-0.5" />
                <span className="text-sm text-dark-gray">
                  Yes{' '}
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium bg-red-50 border border-red-200 rounded px-1.5 py-0.5 ml-1">
                    <AlertCircle className="w-3 h-3" /> Datasets with PII will not be accepted without explicit legal clearance
                  </span>
                </span>
              </label>
            </div>
            {errors.hasPII && <p className="text-[11px] text-red-500 mt-0.5">{errors.hasPII}</p>}
          </Field>

          <Field label="Consent to Share" required>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.consentCertified}
                onChange={e => set('consentCertified', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-rwanda-blue shrink-0"
              />
              <span className="text-sm text-dark-gray group-hover:text-rich-black transition-colors">
                I certify that I have the legal right or permission to share this data or its directory link on Data Discovery Rw.
              </span>
            </label>
            {errors.consentCertified && <p className="text-[11px] text-red-500 mt-0.5">{errors.consentCertified}</p>}
          </Field>
        </div>

        {/* ── Section 6: Submission ── */}
        <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
          <SectionHeader number="6" title="Submission" />
          <Field label="Link to Dataset / Repository" required hint="Google Drive link, GitHub repo, or URL to the official publication.">
            <input className={inputCls} value={form.datasetLink} onChange={e => set('datasetLink', e.target.value)} placeholder="https://…" />
            {errors.datasetLink && <p className="text-[11px] text-red-500 mt-0.5">{errors.datasetLink}</p>}
          </Field>
          <Field label="Additional Notes for the Reviewers">
            <textarea className={textareaCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any context the review team should know…" />
          </Field>

          <div className="bg-off-white border border-light-gray rounded-lg px-4 py-3 text-[11px] text-dark-gray">
            By submitting, you agree to allow the Data Discovery Rw team to review, verify, and catalog
            your submission according to our quality standards.
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please fix the errors above before submitting.
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-rwanda-blue text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Submit Dataset for Review
          </button>
        </div>

      </form>
    </div>
  );
}
