import React from 'react';
import { FirebaseProvider } from './provider';
import { app, auth, db, isFirebaseConfigured } from './config';
import { Leaf, ExternalLink } from 'lucide-react';

const REQUIRED_SECRETS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function FirebaseSetupScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
        <div className="bg-primary/5 border-b border-primary/10 px-8 py-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Leaf className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">EcoPulse AI — Setup Required</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Firebase credentials need to be configured</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Add your Firebase project credentials as <strong>Replit Secrets</strong> to get started.
            These values come from your Firebase Console under{' '}
            <strong>Project Settings → General → Your apps → Web app → SDK setup and configuration</strong>.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">Required Secrets</p>
            {REQUIRED_SECRETS.map((key) => (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-100"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                <code className="text-xs font-mono text-zinc-700 select-all">{key}</code>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">How to add secrets</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Click the <strong>Secrets</strong> padlock icon in the Replit sidebar</li>
              <li>Add each key above with its corresponding value from Firebase Console</li>
              <li>After adding all 6 secrets, restart the EcoPulse workflow</li>
            </ol>
          </div>

          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            aria-label="Open Firebase Console in new tab"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open Firebase Console
          </a>
        </div>
      </div>
    </div>
  );
}

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  return (
    <FirebaseProvider app={app} auth={auth} firestore={db}>
      {children}
    </FirebaseProvider>
  );
};
