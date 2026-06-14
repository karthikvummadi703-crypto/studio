'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types';
import { COLLECTIONS } from '@/lib/constants';

interface FirebaseContextType {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  profile: UserProfile | null;
  isProfileLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

/**
 * Enhanced Firebase Provider that manages a single real-time subscription
 * to the authenticated user's profile document.
 */
export const FirebaseProvider: React.FC<{
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  children: ReactNode;
}> = ({ app, firestore, auth, children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes to trigger profile listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      const profileRef = doc(firestore, COLLECTIONS.USERS, user.uid);
      
      // Single global listener for the user profile
      const unsubscribeProfile = onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ ...snapshot.data(), id: snapshot.id } as UserProfile);
          } else {
            setProfile(null);
          }
          setIsProfileLoading(false);
        },
        (error) => {
          console.error("Profile subscription error:", error);
          setIsProfileLoading(false);
        }
      );

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  return (
    <FirebaseContext.Provider value={{ 
      app, 
      firestore, 
      auth, 
      profile, 
      isProfileLoading 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;

/**
 * Convenience hook to access the shared user profile.
 */
export const useProfile = () => {
  const { profile, isProfileLoading } = useFirebase();
  return { profile, isLoading: isProfileLoading };
};
