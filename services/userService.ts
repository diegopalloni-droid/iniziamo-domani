import { User } from '../types';
import { db } from './firebase';

const usersCollection = db.collection('users');

// IMPORTANT: Seed your database manually in the Firebase Console.
// 1. Create a 'users' collection.
// 2. Add a document for the 'master' user with fields:
//    { username: 'master', name: 'Admin', isActive: true, password: 'your-secure-password' }

export const userService = {
  listenForUsers(
    callback: (users: User[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const unsubscribe = usersCollection.onSnapshot(querySnapshot => {
        const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
        callback(users);
    }, error => {
        console.error("Error listening for user updates:", error);
        onError(error);
    });
    return unsubscribe;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const q = usersCollection.where('username', '==', username.toLowerCase());
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  },

  async addUser(username: string, name: string, password?: string): Promise<{ success: boolean; message?: string }> {
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

    await usersCollection.add(newUser);
    return { success: true };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update(updates);
    return null;
  },

  async deleteUser(userId: string): Promise<void> {
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.delete();
  },
};