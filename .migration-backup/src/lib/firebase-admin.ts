import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin service account env vars.');
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
