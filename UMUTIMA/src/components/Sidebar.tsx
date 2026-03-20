import React, { useState } from 'react';
import {
  LayoutDashboard, Search, BarChart2, Map, Upload,
  Info, Users, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { Page } from '../App';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const topItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'census',   label: 'Overview',      icon: <Users className="w-5 h-5 shrink-0" /> },
  { page: 'explorer', label: 'Data Explorer', icon: <Search className="w-5 h-5 shrink-0" /> },
];

const explorerSubItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { page: 'gaps',      label: 'Gap Analysis', icon: <BarChart2 className="w-4 h-4 shrink-0" /> },
  { page: 'map',       label: 'District Map', icon: <Map className="w-4 h-4 shrink-0" /> },
];

const bottomItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'reports', label: 'Data Contribution', icon: <Upload className="w-5 h-5 shrink-0" /> },
];

function NavContent({
  activePage,
  onNavigate,
  collapsed,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
}) {
  const itemCls = (active: boolean) =>
    `w-full flex items-center rounded-lg font-medium transition-colors text-left border-l-4 ${
      collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
    } ${
      active
        ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue border-rwanda-blue'
        : 'text-dark-gray hover:bg-off-white border-transparent'
    }`;

  const subItemCls = (active: boolean) =>
    `w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left ${
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'
    } ${
      active
        ? 'bg-[rgba(0,161,222,0.1)] text-rwanda-blue'
        : 'text-dark-gray hover:bg-off-white hover:text-rwanda-blue'
    }`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {topItems.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={itemCls(activePage === page)}
            title={collapsed ? label : undefined}
          >
            {icon}
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}

        {/* Sub-items: indent when expanded, centered icons when collapsed */}
        <div className={collapsed ? 'space-y-0.5' : 'pl-4 border-l-2 border-light-gray ml-5 space-y-0.5'}>
          {explorerSubItems.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={subItemCls(activePage === page)}
              title={collapsed ? label : undefined}
            >
              {icon}
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </div>

        <div className="pt-1">
          {bottomItems.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={itemCls(activePage === page)}
              title={collapsed ? label : undefined}
            >
              {icon}
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-2 border-t border-light-gray shrink-0">
        <button
          onClick={() => onNavigate('settings')}
          className={itemCls(activePage === 'settings')}
          title={collapsed ? 'About Us' : undefined}
        >
          <Info className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate">About Us</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ activePage, onNavigate, mobileOpen, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-light-gray h-screen sticky top-0 bg-white transition-all duration-300 ease-in-out ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {/* Logo / header */}
        <div className={`border-b border-light-gray shrink-0 flex items-center ${collapsed ? 'justify-center py-5 px-2' : 'justify-between py-5 px-5'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-full bg-rwanda-blue flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-rwanda-yellow rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-rwanda-blue flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 bg-rwanda-yellow rounded-full" />
                </div>
                <span className="font-display font-bold text-lg text-rich-black truncate">DD Rw PORTAL</span>
              </div>
            </>
          )}
        </div>

        <NavContent activePage={activePage} onNavigate={onNavigate} collapsed={collapsed} />

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className={`shrink-0 flex items-center border-t border-light-gray py-3 text-dark-gray hover:bg-off-white hover:text-rwanda-blue transition-colors ${
            collapsed ? 'justify-center px-2' : 'gap-2 px-5'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Collapse</span></>
          }
        </button>
      </aside>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white shadow-xl md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-light-gray shrink-0 flex items-center justify-between py-5 px-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rwanda-blue flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-rwanda-yellow rounded-full" />
            </div>
            <span className="font-display font-bold text-lg text-rich-black">DD Rw PORTAL</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-dark-gray hover:bg-off-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavContent activePage={activePage} onNavigate={onNavigate} collapsed={false} />
      </aside>
    </>
  );
}
