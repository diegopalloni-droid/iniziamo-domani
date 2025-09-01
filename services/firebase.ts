import { firebaseConfig } from '../firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export the database instance.
export const db = getFirestore(app);

// Initialize Firebase Authentication and export the auth instance.
export const auth = getAuth(app);

// Initialize and export the Google Auth provider.
export const googleProvider = new GoogleAuthProvider();