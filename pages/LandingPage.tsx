import React from 'react';
import { Page } from '../App';
import { PlusIcon } from '../components/PlusIcon';
import { SaveIcon } from '../components/SaveIcon';
import { useAuth } from '../contexts/AuthContext';
import { UserGroupIcon } from '../components/UserGroupIcon';

interface LandingPageProps {
  navigateTo: (page: Page) => void;
  onNewReport: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ navigateTo, onNewReport }) => {
  const { isMasterUser } = useAuth();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Pannello di Controllo
        </h1>
        <p className="text-gray-500 mt-2">
          Seleziona un'opzione per iniziare.
        </p>
      </header>
      <div className="flex flex-col space-y-4">
        <button
          onClick={onNewReport}
          className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon />
          Nuovo Report
        </button>
        <button
          onClick={() => navigateTo('saved')}
          className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <SaveIcon />
          Report Salvati
        </button>
        {isMasterUser && (
           <button
             onClick={() => navigateTo('userManagement')}
             className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold text-lg rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
           >
             <UserGroupIcon />
             Gestione Utenti
           </button>
        )}
      </div>
    </div>
  );
};

export default LandingPage;