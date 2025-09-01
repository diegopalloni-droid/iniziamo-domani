import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { GoogleIcon } from '../components/GoogleIcon';

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
        setLoginError('Nome utente e password sono obbligatori.');
        return;
    }
    setIsLoggingIn(true);
    const result = await login(username, password); 
    if (!result.success) {
      setLoginError(result.reason || 'Si è verificato un errore durante il login.');
    }
    setIsLoggingIn(false);
  };
  
  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setLoginError(result.reason || 'Si è verificato un errore durante il login con Google.');
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
      <header className="mb-8 flex flex-col items-center">
        <Logo />
        <p className="text-gray-500 mt-4">
          Accedi per continuare
        </p>
      </header>
      <div className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome Utente</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="username"
                    aria-label="Nome Utente"
                />
            </div>
             <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                />
            </div>
            
            <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-900 text-white font-medium rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                disabled={isLoggingIn}
            >
                {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
            </button>
        </form>
        
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">o</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200"
            disabled={isLoggingIn}
        >
            <GoogleIcon />
            Accedi con Google
        </button>

        {loginError && <p className="text-red-500 text-sm text-center pt-2">{loginError}</p>}
      </div>
      <footer className="mt-8">
          <p className="text-xs text-gray-400">
             Per accedere, utilizza le credenziali fornite dall'amministratore.
          </p>
      </footer>
    </div>
  );
};

export default LoginPage;