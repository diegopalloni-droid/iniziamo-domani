import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

interface HeaderProps {
  navigateToLanding: () => void;
}

const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ navigateToLanding }) => {
  const { user, logout, isMasterUser } = useAuth();

  return (
    <header className="w-full bg-white shadow-md mb-8 sticky top-0 z-20">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo onClick={navigateToLanding} />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative hidden sm:block">
                 <span className="text-gray-700">
                  Benvenuto, <span className="font-semibold">{user.name}</span>
                </span>
                {isMasterUser && (
                  <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">MASTER</span>
                )}
              </div>
            )}
             <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
                aria-label="Logout"
            >
               <LogoutIcon />
               <span className="hidden md:inline">Logout</span>
           </button>
          </div>
        </div>
      </nav>
    </header>
  );
};