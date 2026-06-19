import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const missingKeys = (Object.keys(firebaseConfig) as (keyof typeof firebaseConfig)[]).filter(
  (k) => !firebaseConfig[k]
);

/** True when all required VITE_FIREBASE_* environment variables are present. */
export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    "[EcoPulse] Firebase credentials not configured.\n" +
      "Add the following Replit Secrets:\n  " +
      [
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_STORAGE_BUCKET",
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "VITE_FIREBASE_APP_ID",
      ].join("\n  ")
  );
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isFirebaseConfigured) {
  try {
    app =
      getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("[EcoPulse] Firebase initialisation failed:", e);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — intentionally undefined when not configured; guarded by isFirebaseConfigured
export { app, auth, db };
