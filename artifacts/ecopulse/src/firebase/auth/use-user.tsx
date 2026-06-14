'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config';
import { IS_DEMO_KEY } from '@/lib/constants';

/**
 * Production-ready useUser hook.
 * - Blocks anonymous sessions from accessing protected routes.
 * - Exposes isDemo flag so components can adapt their UI for demo sessions.
 */
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.isAnonymous) {
        // Anonymous users are only allowed if they explicitly entered demo mode
        const demoFlag =
          typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem(IS_DEMO_KEY) === 'true';
        if (demoFlag) {
          setIsDemo(true);
          setUser(firebaseUser);
        } else {
          setIsDemo(false);
          setUser(null);
        }
      } else {
        setIsDemo(false);
        setUser(firebaseUser);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading, isDemo };
};
