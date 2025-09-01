import { User } from '../types';
import { db, auth } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';


const USERS_COLLECTION = 'users';
const AUTHORIZED_EMAILS_COLLECTION = 'authorizedEmails';

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() } as User);
      });
      return users;
    } catch (error: any) {
        console.error("Error getting users:", error.message || error);
        return [];
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching user by ID:", error.message || error);
      return null;
    }
  },
  
  async findUserByUsername(username: string): Promise<User | null> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error: any) {
        console.error("Error finding user by username:", error.message || error);
        return null;
    }
  },

  async addUser(username: string, email: string, name: string, password?: string): Promise<{ success: boolean; message?: string }> {
    if (!username) {
        return { success: false, message: 'Il nome utente è obbligatorio.' };
    }
    if (!email) {
        return { success: false, message: 'L\'email è obbligatoria.' };
    }
    if (!password || password.length < 6) {
        return { success: false, message: 'La password è obbligatoria e deve essere di almeno 6 caratteri.' };
    }

    try {
        // Check for unique username
        const usernameQuery = query(collection(db, USERS_COLLECTION), where('username', '==', username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            return { success: false, message: 'Questo nome utente è già in uso.' };
        }

        // Step 1: Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newFirebaseUser = userCredential.user;

        // Step 2: Create user profile in Firestore
        const newUser: Omit<User, 'id'> = {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            name: name.trim() || username,
            isActive: true,
            isMaster: false,
        };
        await setDoc(doc(db, USERS_COLLECTION, newFirebaseUser.uid), newUser);

        return { success: true };
    } catch (error: any) {
        console.error("Error adding user:", error.message || error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: 'Questa email è già stata registrata.' };
        }
        if (error.code === 'auth/invalid-email') {
             return { success: false, message: 'Il formato dell\'email non è valido.' };
        }
        return { success: false, message: 'Impossibile creare l\'utente. Riprova.' };
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message?: string }> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, updates);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error.message || error);
        return { success: false, message: "Errore durante l'aggiornamento dell'utente." };
    }
  },
  
  async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    // ================= SECURITY WARNING =================
    // This is a highly privileged operation. For security reasons,
    // the client-side Firebase SDK does NOT allow changing another user's password.
    // This must be done from a trusted server environment using the Firebase Admin SDK.
    //
    // The correct way to implement this is with a Firebase Cloud Function.
    // 1. Create an HTTP-callable Cloud Function (e.g., `updateUserPassword`).
    // 2. In the function, verify that the caller is an admin (master user).
    // 3. Use the `admin.auth().updateUser(userId, { password: newPassword })` method.
    // 4. Call this function from the client.
    //
    // This client-side function is a placeholder to demonstrate the UI flow.
    // In a real app, it would make a call to the Cloud Function.
    // ======================================================
    console.warn("Funzionalità di cambio password non implementata. Richiede una Cloud Function per la sicurezza.");
    return { 
      success: false, 
      message: "Funzione non implementata. Per motivi di sicurezza, questa operazione richiede una configurazione lato server (Firebase Cloud Function)." 
    };
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    // WARNING: This is a simplified client-side implementation.
    // Deleting a Firebase Auth user from the client is not directly possible
    // without admin privileges, which should never be exposed on the client.
    // The most secure way is using a Firebase Cloud Function.
    // This implementation only deletes the Firestore document.
    // The Auth user must be deleted from the Firebase Console.
    try {
        const batch = writeBatch(db);
        
        // 1. Delete user document
        const userRef = doc(db, USERS_COLLECTION, userId);
        batch.delete(userRef);

        // 2. Delete all reports by this user
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, where('userId', '==', userId));
        const reportsSnapshot = await getDocs(q);
        reportsSnapshot.forEach((reportDoc) => {
            batch.delete(reportDoc.ref);
        });

        await batch.commit();
        
        // This function doesn't delete the Firebase Auth user.
        // It must be done manually from the Firebase Console for security.
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user and their reports:", error.message || error);
        return { success: false, message: "Errore durante l'eliminazione dei dati utente." };
    }
  },
  
  // --- Google Auth Authorization ---

  async isGoogleEmailAuthorized(email: string): Promise<boolean> {
    try {
      const docRef = doc(db, AUTHORIZED_EMAILS_COLLECTION, email.toLowerCase());
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Error checking email authorization:", error);
      return false;
    }
  },

  async authorizeGoogleEmail(email: string): Promise<{ success: boolean; message?: string }> {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return { success: false, message: 'Inserisci un indirizzo email valido.' };
    }
    try {
      const docRef = doc(db, AUTHORIZED_EMAILS_COLLECTION, email.toLowerCase());
      await setDoc(docRef, { authorizedAt: new Date() });
      return { success: true };
    } catch (error: any) {
      console.error("Error authorizing email:", error.message || error);
      return { success: false, message: 'Errore durante l\'autorizzazione.' };
    }
  },

  async getAuthorizedGoogleEmails(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, AUTHORIZED_EMAILS_COLLECTION));
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error("Error fetching authorized emails:", error);
      return [];
    }
  },

  async revokeGoogleEmail(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const docRef = doc(db, AUTHORIZED_EMAILS_COLLECTION, email.toLowerCase());
      await deleteDoc(docRef);
      return { success: true };
    } catch (error: any) {
      console.error("Error revoking email authorization:", error.message || error);
      return { success: false, message: 'Errore durante la revoca.' };
    }
  },

  async findOrCreateUserForGoogleSignIn(firebaseUser: FirebaseUser): Promise<void> {
    const userProfile = await this.getUserById(firebaseUser.uid);
    if (!userProfile && firebaseUser.email && firebaseUser.displayName) {
      // User signed in with Google for the first time, create a profile.
      const newUser: Omit<User, 'id'> = {
        username: firebaseUser.email.split('@')[0].toLowerCase(),
        email: firebaseUser.email.toLowerCase(),
        name: firebaseUser.displayName,
        isActive: true,
        isMaster: false,
      };
      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), newUser);
    }
  }
};