import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, signInWithPopup } from 'firebase/auth';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isMasterUser: boolean;
  isAuthLoading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; reason?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; reason?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, get our custom user data from Firestore
        const userProfile = await userService.getUserById(firebaseUser.uid);
        if (userProfile && userProfile.isActive) {
          setUser(userProfile);
        } else {
          // User document not found or user is inactive, sign them out.
          await signOut(auth);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (username: string, password?: string): Promise<{ success: boolean; reason?: string }> => {
    if (!password) {
        return { success: false, reason: 'Password mancante.'}
    }
    
    try {
        // Find user by username to get their email
        const userToLogin = await userService.findUserByUsername(username);

        if (!userToLogin) {
            return { success: false, reason: 'Nome utente o password non corretti.' };
        }
        if (!userToLogin.isActive) {
            return { success: false, reason: 'Questo account è stato disabilitato.' };
        }
        
        await signInWithEmailAndPassword(auth, userToLogin.email, password);
        // onAuthStateChanged will handle setting the user state
        return { success: true };
    } catch (error: any) {
        let reason = 'Credenziali non valide.';
        if (error.code === 'auth/wrong-password') {
            reason = 'Nome utente o password non corretti.';
        }
        console.error("Login failed:", error.message || error);
        return { success: false, reason };
    }
  };
  
  const loginWithGoogle = async (): Promise<{ success: boolean; reason?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      if (!googleUser.email) {
        await signOut(auth);
        return { success: false, reason: 'Impossibile ottenere l\'email dal tuo account Google.' };
      }
      
      const isAuthorized = await userService.isGoogleEmailAuthorized(googleUser.email);
      
      if (!isAuthorized) {
        await signOut(auth);
        return { success: false, reason: 'Il tuo account Google non è autorizzato ad accedere.' };
      }
      
      // Email is authorized, ensure user profile exists in our 'users' collection
      await userService.findOrCreateUserForGoogleSignIn(googleUser);
      // onAuthStateChanged will handle setting the user state
      return { success: true };
      
    } catch (error: any) {
      let reason = 'Accesso con Google non riuscito.';
      if (error.code === 'auth/popup-closed-by-user') {
        reason = 'La finestra di accesso è stata chiusa.';
      }
      console.error("Google login failed:", error.message || error);
      return { success: false, reason };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };
  
  const isLoggedIn = !!user;
  const isMasterUser = !!user?.isMaster;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isMasterUser, isAuthLoading, login, loginWithGoogle, logout }}>
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