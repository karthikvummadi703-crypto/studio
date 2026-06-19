"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { DocumentReference, onSnapshot, DocumentSnapshot, DocumentData } from "firebase/firestore";

/**
 * Optimized useDoc hook with reference stability and data reference stability.
 * Ensures the returned data object only changes reference when the underlying document data changes.
 */
export const useDoc = <T = DocumentData,>(docRef: DocumentReference<T> | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevDataRef = useRef<string>("");

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
        const docData = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;

        // Stabilize data reference using JSON comparison
        const dataJson = JSON.stringify(docData);
        if (dataJson !== prevDataRef.current) {
          prevDataRef.current = dataJson;
          setData(docData as T & { id: string });
        }
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
