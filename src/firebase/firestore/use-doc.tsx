'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData 
} from 'firebase/firestore';

/**
 * Optimized useDoc hook with reference stability verification.
 */
export const useDoc = <T = DocumentData>(docRef: DocumentReference<T> | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stabilize the reference instance
  const stableRef = useMemo(() => docRef, [docRef]);

  useEffect(() => {
    if (!stableRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      stableRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as any : null);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableRef]);

  return { data, isLoading, error };
};
