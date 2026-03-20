import React from 'react';
import { Target, Eye, AlertTriangle, CheckSquare, Shield, Users, BookOpen, Mail, Phone, Github, Linkedin } from 'lucide-react';
import type { Page } from '../App';

// X (Twitter) icon — not in lucide-react, inline SVG
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.636 5.906-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface Props {
  onNavigate?: (page: Page) => void;
}

const PILLARS = [
  { icon: <Users className="w-4 h-4" />, title: 'Population', desc: 'Demographic shifts and vulnerability mapping.' },
  { icon: <BookOpen className="w-4 h-4" />, title: 'Education', desc: 'Human capital trends and literacy gaps.' },
  { icon: <CheckSquare className="w-4 h-4" />, title: 'Health', desc: 'Life cycle outcomes and sanitation indicators.' },
  { icon: <AlertTriangle className="w-4 h-4" />, title: 'Agriculture', desc: 'Livelihood resilience and food security.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Households', desc: 'Living conditions and poverty proxies.' },
];

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="text-rwanda-blue">{icon}</span>
      <h2 className="text-base font-display font-semibold text-rich-black">{title}</h2>
    </div>
  );
}

export default function Settings({ onNavigate }: Props) {
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5 pb-10">

      {/* Hero */}
      <div className="bg-rwanda-blue rounded-2xl px-6 py-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-rwanda-yellow" />
          </div>
          <span className="font-display font-bold text-2xl">Data Discovery Rw</span>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
          A curated discovery layer bridging complex official repositories and the actionable needs
          of Civil Society Organizations and Policy Makers in Rwanda.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <SectionTitle icon={<Target className="w-4 h-4" />} title="Our Mission" />
          <p className="text-sm text-dark-gray leading-relaxed">
            To democratize access to high-quality, fact-checked data in Rwanda, bridging the gap between
            complex official repositories and the actionable needs of Civil Society Organizations (CSOs)
            and Policy Makers.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <SectionTitle icon={<Eye className="w-4 h-4" />} title="Our Vision" />
          <p className="text-sm text-dark-gray leading-relaxed">
            To become the definitive evidence-base for social intervention in Rwanda, fostering a culture
            of data-driven decision-making that leads to more impactful, transparent, and equitable
            development outcomes.
          </p>
        </div>
      </div>

      {/* Context */}
      <div className="bg-white rounded-xl border border-light-gray p-5">
        <SectionTitle icon={<AlertTriangle className="w-4 h-4" />} title="The Context: Why Data Discovery Rw?" />
        <p className="text-sm text-dark-gray leading-relaxed mb-3">
          In the modern development landscape, data is abundant but often fragmented. While the Government
          of Rwanda and private entities produce extensive census data, sectoral reports, and economic
          indicators, these resources are often:
        </p>
        <ul className="space-y-2 mb-3">
          {[
            { term: 'Siloed', desc: 'Spread across multiple ministerial websites and private portals.' },
            { term: 'Complex', desc: 'Stored in large, raw tables that require specialized analysis to interpret.' },
            { term: 'Hard to Verify', desc: 'Distributed without standardized metadata, making it difficult for CSOs to assess "data fitness" for specific interventions.' },
          ].map(item => (
            <li key={item.term} className="flex items-start gap-2 text-sm text-dark-gray">
              <span className="w-1.5 h-1.5 rounded-full bg-rwanda-blue mt-2 shrink-0" />
              <span><span className="font-semibold text-rich-black">{item.term}:</span> {item.desc}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-dark-gray leading-relaxed">
          Data Discovery Rw was born to solve these challenges. We act as a curated directory and
          discovery layer that sits on top of official data, translating <em>"Numbers"</em> into <em>"Knowledge."</em>
        </p>
      </div>

      {/* What We Do */}
      <div className="bg-white rounded-xl border border-light-gray p-5 space-y-5">
        <SectionTitle icon={<CheckSquare className="w-4 h-4" />} title="What We Do" />

        <div className="space-y-4">
          {[
            {
              num: '1',
              title: 'Expert Fact-Checking & Curation',
              desc: 'Every dataset listed in our repository undergoes a rigorous verification process. We ensure that the data originates from recognized governmental or private entities and that the metadata accurately reflects the collection methodology.',
            },
            {
              num: '2',
              title: 'Sectoral Intelligence',
              desc: 'We organize data into five critical pillars to help users find exactly what they need for their specific mandate:',
              pillars: true,
            },
            {
              num: '3',
              title: 'Data Quality & Resources',
              desc: "We don't just provide links; we provide context. Each entry includes data quality information, known limitations, and links to the original studies or methodology papers to ensure users intervene with full awareness of the data's scope.",
            },
            {
              num: '4',
              title: 'Legal Compliance & Privacy',
              desc: "Operating under Rwanda's Law Nº 058/2021 relating to the Protection of Personal Data and Privacy, we prioritize the ethical handling of information. We facilitate access to public data and provide clear pathways for restricted data, ensuring all users and contributors remain compliant with national privacy standards.",
            },
          ].map(item => (
            <div key={item.num} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-rwanda-blue text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-rich-black mb-1">{item.title}</h3>
                <p className="text-sm text-dark-gray leading-relaxed">{item.desc}</p>
                {item.pillars && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PILLARS.map(p => (
                      <div key={p.title} className="flex items-start gap-2 text-xs text-dark-gray bg-off-white rounded-lg px-3 py-2">
                        <span className="text-rwanda-blue mt-0.5">{p.icon}</span>
                        <span><span className="font-semibold text-rich-black">{p.title}:</span> {p.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who We Serve */}
      <div className="bg-white rounded-xl border border-light-gray p-5">
        <SectionTitle icon={<Users className="w-4 h-4" />} title="Who We Serve" />
        <div className="space-y-3">
          {[
            { audience: 'Civil Society Organizations (CSOs)', desc: 'To help them identify exactly where to build a school, who needs nutritional support, and when to launch a seasonal campaign.' },
            { audience: 'Policy Makers', desc: 'Providing a bird\'s-eye view of sectoral performance to inform evidence-based legislation.' },
            { audience: 'Researchers & Open-Source Contributors', desc: 'Offering a platform to share validated datasets that contribute to the national knowledge commons.' },
          ].map(item => (
            <div key={item.audience} className="flex items-start gap-2 text-sm text-dark-gray">
              <span className="w-1.5 h-1.5 rounded-full bg-rwanda-blue mt-2 shrink-0" />
              <span><span className="font-semibold text-rich-black">{item.audience}:</span> {item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commitment to Openness */}
      <div className="bg-off-white border border-light-gray rounded-xl p-5">
        <SectionTitle icon={<BookOpen className="w-4 h-4" />} title="Our Commitment to Openness" />
        <p className="text-sm text-dark-gray leading-relaxed mb-4">
          As an open-source-friendly platform, we believe that the best data comes from a collaborative
          ecosystem. We invite experts and organizations to contribute to our directory, helping us build
          a more comprehensive map of Rwanda's progress.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate?.('explorer')}
            className="px-4 py-2 bg-rwanda-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Explore Data Directory
          </button>
          <button
            onClick={() => onNavigate?.('reports')}
            className="px-4 py-2 border border-rwanda-blue text-rwanda-blue text-sm font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Contribute a Dataset
          </button>
        </div>
      </div>

      {/* Contact & Social */}
      <div className="bg-white rounded-xl border border-light-gray p-5">
        <SectionTitle icon={<Mail className="w-4 h-4" />} title="Contact Us" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <a href="mailto:info@datadiscovery.rw" className="flex items-center gap-2 text-sm text-dark-gray hover:text-rwanda-blue transition">
            <Mail className="w-4 h-4 shrink-0 text-rwanda-blue" />
            info@datadiscovery.rw
          </a>
          <a href="tel:+250789405950" className="flex items-center gap-2 text-sm text-dark-gray hover:text-rwanda-blue transition">
            <Phone className="w-4 h-4 shrink-0 text-rwanda-blue" />
            +250 789 405 950
          </a>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-dark-gray uppercase tracking-wider">Follow us:</span>
          <a
            href="https://www.linkedin.com/company/datadiscoveryRw"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-light-gray text-xs font-medium text-dark-gray hover:border-[#0A66C2] hover:text-[#0A66C2] transition"
            title="LinkedIn"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href="https://x.com/datadiscoveryRw"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-light-gray text-xs font-medium text-dark-gray hover:border-black hover:text-black transition"
            title="X (Twitter)"
          >
            <XIcon className="w-3.5 h-3.5" />
            @datadiscoveryRw
          </a>
          <a
            href="https://github.com/datadiscoveryRw"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-light-gray text-xs font-medium text-dark-gray hover:border-gray-800 hover:text-gray-800 transition"
            title="GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-medium-gray text-center">
        © {new Date().getFullYear()} Data Discovery Rw · All rights reserved ·{' '}
        <a href="https://www.datadiscovery.rw/about" target="_blank" rel="noopener noreferrer" className="hover:underline text-rwanda-blue">
          www.datadiscovery.rw
        </a>
      </p>

    </div>
  );
}
