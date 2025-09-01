import { User } from '../types';
import { db } from './firebase';
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    FirestoreError,
} from 'firebase/firestore';

const usersCollection = collection(db, 'users');

// IMPORTANT: Seed your database manually in the Firebase Console.
// 1. Create a 'users' collection.
// 2. Add a document for the 'master' user with fields:
//    { username: 'master', name: 'Admin', isActive: true, password: 'your-secure-password' }

export const userService = {
  listenForUsers(
    callback: (users: User[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const unsubscribe = onSnapshot(usersCollection, querySnapshot => {
        const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
        callback(users);
    }, (error: FirestoreError) => {
        console.error("Error listening for user updates:", error);
        onError(new Error(error.message));
    });
    return unsubscribe;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const q = query(usersCollection, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  },

  async addUser(username: string, name: string, password?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const usernameLower = username.toLowerCase().trim();

      if (!usernameLower) {
          return { success: false, message: 'Il nome utente è obbligatorio.' };
      }

      const existingUser = await this.getUserByUsername(usernameLower);
      if (existingUser) {
        return { success: false, message: 'Questo nome utente esiste già.' };
      }
      
      if (!password || password.length < 6) {
          return { success: false, message: 'La password è obbligatoria e deve essere di almeno 6 caratteri.' };
      }

      const newUser = {
        username: usernameLower,
        name: name.trim() || usernameLower,
        isActive: true,
        password: password,
      };

      await addDoc(usersCollection, newUser);
      return { success: true };
    } catch(error) {
        console.error("Error adding user:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred while adding user.";
        return { success: false, message };
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message?: string }> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, updates);
      return { success: true };
    } catch(error) {
        console.error("Error updating user:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred while updating user.";
        return { success: false, message };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      return { success: true };
    } catch(error) {
        console.error("Error deleting user:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred while deleting user.";
        return { success: false, message };
    }
  },
};