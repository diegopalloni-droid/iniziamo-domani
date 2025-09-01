import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ReportCreator from './pages/ReportCreator';
import SavedReports from './pages/SavedReports';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import { SavedReport } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';

export type Page = 'landing' | 'creator' | 'saved' | 'userManagement';

const AppContent: React.FC = () => {
  const { isLoggedIn, isMasterUser } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [reportToEdit, setReportToEdit] = useState<SavedReport | null>(null);

  useEffect(() => {
    // When the user logs out, reset the application state to the landing page.
    if (!isLoggedIn) {
      setCurrentPage('landing');
      setReportToEdit(null);
    }
  }, [isLoggedIn]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };
  
  const handleEditReport = (report: SavedReport) => {
    setReportToEdit(report);
    setCurrentPage('creator');
  };

  const handleNewReport = () => {
    setReportToEdit(null);
    setCurrentPage('creator');
  };
  
  if (!isLoggedIn) {
      return (
         <div className="min-h-screen flex items-center justify-center p-4">
            <LoginPage />
         </div>
      );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'creator':
        return <ReportCreator navigateTo={navigateTo} initialReport={reportToEdit} onEditReport={handleEditReport} />;
      case 'saved':
        return <SavedReports navigateTo={navigateTo} onEditReport={handleEditReport} />;
      case 'userManagement':
        return isMasterUser ? <UserManagementPage navigateTo={navigateTo} /> : <LandingPage navigateTo={navigateTo} onNewReport={handleNewReport} />;
      case 'landing':
      default:
        return <LandingPage navigateTo={navigateTo} onNewReport={handleNewReport} />;
    }
  };

  return (
    <>
      <Header navigateToLanding={() => navigateTo('landing')} />
      <main className="w-full flex-grow flex flex-col items-center px-4 pb-8">
        {renderPage()}
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;