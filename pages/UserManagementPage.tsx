import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { User } from '../types';
import { userService } from '../services/userService';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { TrashIcon } from '../components/TrashIcon';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { KeyIcon } from '../components/KeyIcon';
import { EyeIcon } from '../components/EyeIcon';
import { EyeOffIcon } from '../components/EyeOffIcon';
import { GoogleIcon } from '../components/GoogleIcon';

interface UserManagementPageProps {
  navigateTo: (page: Page) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ navigateTo }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [error, setError] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState('');


  useEffect(() => {
    loadAllData();
  }, []);
  
  const loadAllData = async () => {
    setIsLoading(true);
    const allUsers = await userService.getUsers();
    setUsers(allUsers.filter(u => !u.isMaster));
    const emails = await userService.getAuthorizedGoogleEmails();
    setAuthorizedEmails(emails);
    setIsLoading(false);
  };

  const loadAuthorizedEmails = async () => {
    const emails = await userService.getAuthorizedGoogleEmails();
    setAuthorizedEmails(emails);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await userService.addUser(newUserUsername, newUserEmail, newUserName, newUserPassword);
    if (result.success) {
      setNewUserEmail('');
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      loadAllData();
    } else {
      setError(result.message || 'Errore sconosciuto.');
    }
  };
  
  const handleToggleUserStatus = async (user: User) => {
    const result = await userService.updateUser(user.id, { isActive: !user.isActive });
    if (result.success) {
      loadAllData();
    } else {
      alert(result.message || "Impossibile aggiornare lo stato dell'utente.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi report? L'azione è irreversibile. L'account di accesso dovrà essere rimosso separatamente dalla console Firebase.")) {
        const result = await userService.deleteUser(userId);
        if (result.success) {
          loadAllData();
        } else {
          alert(result.message || "Impossibile eliminare l'utente.");
        }
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setEditingUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleClosePasswordModal = () => {
    setEditingUser(null);
  };
  
  const handlePasswordChange = async () => {
    if (!editingUser) return;
    
    if (newPassword.length < 6) {
      setPasswordError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono.');
      return;
    }
    
    setPasswordError('');
    const result = await userService.updateUserPassword(editingUser.id, newPassword);
    if (result.success) {
      alert('Password aggiornata con successo!');
      handleClosePasswordModal();
    } else {
      setPasswordError(result.message || 'Errore durante l\'aggiornamento della password.');
    }
  };
  
  const handleAuthorizeGoogleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleAuthError('');
    const result = await userService.authorizeGoogleEmail(newGoogleEmail);
    if (result.success) {
      setNewGoogleEmail('');
      loadAuthorizedEmails();
    } else {
      setGoogleAuthError(result.message || 'Errore sconosciuto.');
    }
  };
  
  const handleRevokeGoogleEmail = async (email: string) => {
    if (window.confirm(`Sei sicuro di voler revocare l'accesso per ${email}?`)) {
      await userService.revokeGoogleEmail(email);
      loadAuthorizedEmails();
    }
  };

  const renderPasswordModal = () => {
    if (!editingUser) return null;
    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
          <h2 className="text-xl font-bold text-gray-800">Cambia Password</h2>
          <p className="text-gray-600 mt-2">Stai cambiando la password per <span className="font-semibold">{editingUser.name}</span>.</p>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-pass">Nuova Password</label>
              <input 
                id="new-pass" 
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm-pass">Conferma Password</label>
              <input 
                id="confirm-pass" 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button onClick={handleClosePasswordModal} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Annulla</button>
            <button onClick={handlePasswordChange} className="px-6 py-2 bg-blue-900 text-white font-semibold rounded-md shadow-sm hover:bg-blue-800">Salva</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 relative">
      {renderPasswordModal()}
      <div className="p-8 space-y-8">
        <header>
          <div className="relative flex items-center justify-center">
            <button onClick={() => navigateTo('landing')} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md p-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900" aria-label="Torna al pannello di controllo">
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gestione Utenti</h1>
          </div>
          <p className="mt-2 text-center text-gray-500">
            Aggiungi utenti, abilita l'accesso e autorizza account Google.
          </p>
        </header>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Utente (Username/Password)</h2>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label htmlFor="new-user-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input id="new-user-username" type="text" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} placeholder="es. mrossi" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="lg:col-span-1">
                    <label htmlFor="new-user-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input id="new-user-name" type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="es. Mario Rossi" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="lg:col-span-1">
                    <label htmlFor="new-user-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input id="new-user-email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="utente@dominio.com" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="lg:col-span-1">
                    <label htmlFor="new-user-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input id="new-user-password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Min. 6 caratteri" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <button type="submit" className="lg:col-span-1 px-6 py-2 bg-blue-900 text-white font-bold rounded-md shadow-sm hover:bg-blue-800 h-10">Aggiungi</button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Utenti Autorizzati</h2>
            {isLoading ? (
                <p className="text-center text-gray-500 py-4">Caricamento...</p>
            ) : users.length > 0 ? (
                <div className="divide-y divide-gray-200">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-semibold text-gray-800">{user.name} <span className="text-sm text-gray-500 font-normal">({user.username})</span></p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <ToggleSwitch checked={user.isActive} onChange={() => handleToggleUserStatus(user)} />
                            <button onClick={() => handleOpenPasswordModal(user)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" aria-label="Cambia password"><KeyIcon /></button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" aria-label="Elimina utente"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 py-4">Nessun utente aggiunto.</p>
            )}
        </div>
        
        <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold text-gray-800">Autorizzazione Accesso Google</h2>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <form onSubmit={handleAuthorizeGoogleEmail} className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="google-email" className="block text-sm font-medium text-gray-700 mb-1">Email Account Google</label>
                        <input id="google-email" type="email" value={newGoogleEmail} onChange={(e) => setNewGoogleEmail(e.target.value)} placeholder="utente.google@gmail.com" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <button type="submit" className="px-6 py-2 bg-blue-900 text-white font-bold rounded-md shadow-sm hover:bg-blue-800 h-10">Autorizza</button>
                </form>
                 {googleAuthError && <p className="text-red-500 text-sm mt-2">{googleAuthError}</p>}
            </div>
            
             <h3 className="text-lg font-semibold text-gray-700 pt-2">Email Autorizzate</h3>
              {isLoading ? (
                <p className="text-center text-gray-500 py-4">Caricamento...</p>
            ) : authorizedEmails.length > 0 ? (
                 <div className="divide-y divide-gray-200">
                    {authorizedEmails.map(email => (
                         <div key={email} className="flex items-center justify-between p-4">
                             <div className="flex items-center gap-3">
                                <GoogleIcon />
                                <p className="font-mono text-gray-800">{email}</p>
                             </div>
                              <button onClick={() => handleRevokeGoogleEmail(email)} className="px-4 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-md hover:bg-red-200">Revoca</button>
                         </div>
                    ))}
                 </div>
            ) : (
                <p className="text-center text-gray-500 py-4">Nessuna email autorizzata per l'accesso con Google.</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default UserManagementPage;