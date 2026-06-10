
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCiAHwWhFFF7RyOByxe4PsYxOSy8jgKZAo",
  authDomain: "studio-9772282798-f7257.firebaseapp.com",
  projectId: "studio-9772282798-f7257",
  storageBucket: "studio-9772282798-f7257.firebasestorage.app",
  messagingSenderId: "9772282798",
  appId: "1:9772282798:web:48a7b8e96f5e4d3c2b1a", // Using inferred App ID based on project structure
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw error;
}

export { app, auth, db };
