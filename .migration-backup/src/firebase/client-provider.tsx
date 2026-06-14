
'use client';

import React from 'react';
import { FirebaseProvider } from './provider';
import { app, auth, db } from './config';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FirebaseProvider app={app} auth={auth} firestore={db}>
      {children}
    </FirebaseProvider>
  );
};
