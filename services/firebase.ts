import { firebaseConfig } from '../firebaseConfig';

// This file assumes the Firebase SDKs are loaded globally via <script> tags in index.html.
// We declare the global 'firebase' object to make it available to TypeScript.
declare const firebase: any;

// Initialize Firebase, but only if it hasn't been initialized already.
// This prevents errors during development hot-reloads.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Cloud Firestore and export the database instance.
export const db = firebase.firestore();
