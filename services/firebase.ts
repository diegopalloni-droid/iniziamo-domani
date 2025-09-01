import { firebaseConfig } from '../firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export the database instance.
export const db = getFirestore(app);
