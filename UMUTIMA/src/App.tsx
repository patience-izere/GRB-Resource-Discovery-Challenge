import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DataExplorerPage from './pages/DataExplorerPage';
import GapAnalysis from './pages/GapAnalysis';
import DistrictMap from './pages/DistrictMap';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CensusPage from './pages/CensusPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DistrictProvider } from './context/DistrictContext';
import WelcomeConsent from './components/WelcomeConsent';

export type Page = 'dashboard' | 'explorer' | 'gaps' | 'map' | 'reports' | 'settings' | 'census';

const queryClient = new QueryClient();

export default function App() {
  const [page, setPage] = useState<Page>('census');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'explorer': return <DataExplorerPage />;
      case 'gaps': return <GapAnalysis />;
      case 'map': return <DistrictMap />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings onNavigate={navigate} />;
      case 'census': return <CensusPage />;
      default: return <Dashboard />;
    }
  };

  function navigate(p: Page) {
    setPage(p);
    setMobileNavOpen(false);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DistrictProvider>
        <WelcomeConsent forceOpen={consentOpen} onClose={() => setConsentOpen(false)} />
        <div className="flex min-h-screen bg-off-white font-sans text-soft-black">
          <Sidebar activePage={page} onNavigate={navigate} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header onMenuToggle={() => setMobileNavOpen(v => !v)} onInfoClick={() => setConsentOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              {renderPage()}
            </main>
          </div>
        </div>
      </DistrictProvider>
    </QueryClientProvider>
  );
}
