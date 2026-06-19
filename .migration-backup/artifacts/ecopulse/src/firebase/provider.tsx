'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types';
import { COLLECTIONS } from '@/lib/constants';
import {
  getLocalProfile,
  initLocalProfile,
  setLocalProfile,
  mergeFirestoreProfile,
  LocalProfileData,
} from '@/lib/local-profile';

interface FirebaseContextType {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  profile: UserProfile | null;
  isProfileLoading: boolean;
  /** Optimistically update profile scores (local-first, synced to Firestore when rules allow). */
  updateProfileScores: (delta: { greenPoints: number; sustainabilityScore: number }) => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

function buildProfileFromLocal(
  local: LocalProfileData,
  base: Partial<UserProfile>
): UserProfile {
  return {
    fullName: base.fullName ?? '',
    email: base.email ?? '',
    level: base.level ?? 'Seedling',
    createdAt: base.createdAt ?? (new Date() as unknown as import('firebase/firestore').Timestamp),
    completedChallenges: base.completedChallenges ?? [],
    id: base.id,
    greenPoints: local.greenPoints,
    sustainabilityScore: local.sustainabilityScore,
  };
}

/**
 * Enhanced Firebase Provider with localStorage fallback for profile scores.
 * When Firestore security rules are not yet deployed (permission-denied),
 * the provider falls back to localStorage so the dashboard always shows
 * up-to-date metrics after calculator saves.
 */
export const FirebaseProvider: React.FC<{
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  children: ReactNode;
}> = ({ app, firestore, auth, children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [profileBase, setProfileBase] = useState<Partial<UserProfile>>({});

  // Optimistic update: increments local scores and re-derives the profile state.
  const updateProfileScores = useCallback(
    (delta: { greenPoints: number; sustainabilityScore: number }) => {
      if (!currentUid) return;
      const local = getLocalProfile(currentUid) ?? initLocalProfile(currentUid);
      const updated: LocalProfileData = {
        greenPoints: local.greenPoints + delta.greenPoints,
        sustainabilityScore: Math.min(99, local.sustainabilityScore + delta.sustainabilityScore),
        updatedAt: Date.now(),
      };
      setLocalProfile(currentUid, updated);
      setProfile((prev) => buildProfileFromLocal(updated, prev ?? profileBase));
    },
    [currentUid, profileBase]
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        setCurrentUid(null);
        setProfileBase({});
        return;
      }

      setCurrentUid(user.uid);
      setIsProfileLoading(true);

      // Seed localStorage with defaults if this user has never opened the app.
      const local = initLocalProfile(user.uid);

      const profileRef = doc(firestore, COLLECTIONS.USERS, user.uid);

      const unsubscribeProfile = onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = { ...snapshot.data(), id: snapshot.id } as UserProfile;
            // Merge Firestore values into localStorage (take the higher of the two)
            mergeFirestoreProfile(user.uid, {
              greenPoints: data.greenPoints,
              sustainabilityScore: data.sustainabilityScore,
            });
            const merged = getLocalProfile(user.uid)!;
            const merged_profile = buildProfileFromLocal(merged, data);
            setProfileBase(data);
            setProfile(merged_profile);
          } else {
            // Profile document doesn't exist yet — show localStorage values.
            setProfileBase({ email: user.email ?? '', fullName: user.displayName ?? '' });
            setProfile(
              buildProfileFromLocal(local, {
                email: user.email ?? '',
                fullName: user.displayName ?? '',
              })
            );
          }
          setIsProfileLoading(false);
        },
        (error) => {
          // Firestore rules not deployed yet — fall back to localStorage silently.
          if (error.code === 'permission-denied') {
            const fallback = getLocalProfile(user.uid) ?? initLocalProfile(user.uid);
            setProfileBase({ email: user.email ?? '', fullName: user.displayName ?? '' });
            setProfile(
              buildProfileFromLocal(fallback, {
                email: user.email ?? '',
                fullName: user.displayName ?? '',
              })
            );
          } else {
            console.error('Profile subscription error:', error);
          }
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
      isProfileLoading,
      updateProfileScores,
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
