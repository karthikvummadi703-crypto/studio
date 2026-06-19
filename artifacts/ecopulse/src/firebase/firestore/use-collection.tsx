'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';

/**
 * Optimized useCollection hook with query stability and data reference stability.
 * Prevents unnecessary re-renders by performing a JSON comparison on incoming data.
 */
export const useCollection = <T = DocumentData>(query: Query<T> | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevDataRef = useRef<string>('');

  // Stabilize the query instance if it was created inline
  const stableQuery = useMemo(() => query, [query]);

  useEffect(() => {
    if (!stableQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        // Stabilize data reference using JSON comparison to prevent unnecessary re-renders
        const itemsJson = JSON.stringify(items);
        if (itemsJson !== prevDataRef.current) {
          prevDataRef.current = itemsJson;
          setData(items as (T & { id: string })[]);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery]);

  return { data, isLoading, error };
};
