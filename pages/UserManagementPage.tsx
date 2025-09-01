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

interface UserManagementPageProps {
  navigateTo: (page: Page) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ navigateTo }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = userService.listenForUsers(
      (allUsers) => {
        setUsers(allUsers.filter(u => u.username !== 'master'));
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to listen for users:", error);
        setError("Impossibile caricare gli utenti.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  
  const fetchUsers = () => {
    // This function is now effectively handled by the real-time listener.
    // Kept here in case of future need for a manual refresh button.
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await userService.addUser(newUsername, newUserName, newUserPassword);
    if (result.success) {
      setNewUsername('');
      setNewUserName('');
      setNewUserPassword('');
      // No need to call fetchUsers(), listener will update the state
    } else {
      setError(result.message || 'Errore sconosciuto.');
    }
  };
  
  const handleToggleUserStatus = async (user: User) => {
    await userService.updateUser(user.id, { isActive: !user.isActive });
    // No need to call fetchUsers()
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente? L'azione è permanente.")) {
        await userService.deleteUser(userId);
        // No need to call fetchUsers()
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setEditingUser(user);
    setNewPassword('');
    setError('');
  };

  const handleClosePasswordModal = () => {
    setEditingUser(null);
    setNewPassword('');
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && newPassword) {
      if (newPassword.length < 6) {
          alert('La password deve essere di almeno 6 caratteri.');
          return;
      }
      await userService.updateUser(editingUser.id, { password: newPassword });
      handleClosePasswordModal();
    }
  };
  
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <>
      {/* Password Change Modal */}
      {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                  <h2 className="text-xl font-bold text-gray-800">Cambia Password</h2>
                  <p className="text-gray-600 mt-2">Nuova password per <span className="font-semibold">{editingUser.username}</span></p>
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                      <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nuova password (min. 6 caratteri)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          autoFocus
                      />
                      <div className="flex justify-end gap-3">
                          <button
                              type="button"
                              onClick={handleClosePasswordModal}
                              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
                          >
                              Annulla
                          </button>
                          <button
                              type="submit"
                              className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-md shadow-sm hover:bg-blue-800"
                          >
                              Salva
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-8 space-y-8">
          <header>
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => navigateTo('landing')}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md p-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Torna al pannello di controllo"
              >
                <ArrowLeftIcon />
                <span className="hidden sm:inline">Indietro</span>
              </button>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gestione Utenti</h1>
            </div>
            <p className="mt-2 text-center text-gray-500">
              Aggiungi, abilita o disabilita l'accesso degli utenti all'applicazione.
            </p>
          </header>

          {/* Add User Form */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Nuovo Utente</h2>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                      <label htmlFor="new-user-username" className="block text-sm font-medium text-gray-700 mb-1">Nome Utente</label>
                      <input
                          id="new-user-username"
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="es. nome.cognome"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                      />
                  </div>
                   <div className="md:col-span-1">
                      <label htmlFor="new-user-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <input
                          id="new-user-name"
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="es. Nome Cognome"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                      />
                  </div>
                  <div className="md:col-span-1">
                      <label htmlFor="new-user-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                          id="new-user-password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Min. 6 caratteri"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                      />
                  </div>
                  <button
                      type="submit"
                      className="md:col-span-1 px-6 py-2 bg-blue-900 text-white font-bold rounded-md shadow-sm hover:bg-blue-800 h-10"
                  >
                      Aggiungi
                  </button>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Users List */}
          <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Utenti Autorizzati</h2>
              {isLoading ? (
                  <p className="text-center text-gray-500 py-4">Caricamento...</p>
              ) : users.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                  {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">{user.name}</p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                                  {visiblePasswords[user.id] ? user.password : '••••••••'}
                                </span>
                                <button
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    className="p-1 text-gray-500 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    aria-label={visiblePasswords[user.id] ? 'Nascondi password' : 'Mostra password'}
                                >
                                    {visiblePasswords[user.id] ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <button
                                  onClick={() => handleOpenPasswordModal(user)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                  aria-label="Cambia password"
                              >
                                  <KeyIcon />
                              </button>
                              <ToggleSwitch
                                  checked={user.isActive}
                                  onChange={() => handleToggleUserStatus(user)}
                              />
                              <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                  aria-label="Elimina utente"
                              >
                                  <TrashIcon />
                              </button>
                          </div>
                      </div>
                  ))}
                  </div>
              ) : (
                  <p className="text-center text-gray-500 py-4">Nessun utente aggiunto. Aggiungine uno per iniziare.</p>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;