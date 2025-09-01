

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';

const MASTER_USER_USERNAME = 'master';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isMasterUser: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; reason?: 'unauthorized' | 'disabled' | 'invalid_credentials' }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password?: string): Promise<{ success: boolean; reason?: 'unauthorized' | 'disabled' | 'invalid_credentials' }> => {
    const authorizedUser = await userService.getUserByUsername(username);
    
    if (!authorizedUser) {
      return { success: false, reason: 'unauthorized' };
    }

    // All users, including master, need to provide a valid password.
    if (!authorizedUser.password || authorizedUser.password !== password) {
        return { success: false, reason: 'invalid_credentials' };
    }

    if (!authorizedUser.isActive) {
        return { success: false, reason: 'disabled' };
    }

    if (!authorizedUser.name) {
      authorizedUser.name = authorizedUser.username;
    }
    
    setUser(authorizedUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };
  
  const isLoggedIn = !!user;
  const isMasterUser = user?.username === MASTER_USER_USERNAME;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isMasterUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};