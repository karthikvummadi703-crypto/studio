'use client';

import { useState, useEffect } from 'react';
import { 
  doc, 
  query, 
  collection, 
  where, 
  orderBy, 
  Firestore,
  onSnapshot 
} from 'firebase/firestore';
import { UserProfile, AIConversation } from '@/types';

interface AdvisorDataState {
  profile: UserProfile | null;
  chats: AIConversation[];
  isLoading: boolean;
}

/**
 * Custom hook that batches profile and chat history subscriptions into a single state object.
 * @param userId The current authenticated user ID.
 * @param db The Firestore database instance.
 */
export function useAdvisorData(userId: string | undefined, db: Firestore | undefined): AdvisorDataState {
  const [data, setData] = useState<AdvisorDataState>({
    profile: null,
    chats: [],
    isLoading: true
  });

  useEffect(() => {
    if (!userId || !db) {
      setData({ profile: null, chats: [], isLoading: false });
      return;
    }

    const profileRef = doc(db, 'users', userId);
    const historyQuery = query(
      collection(db, 'ai_conversations'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    let profileReady = false;
    let chatsReady = false;

    const profileUnsub = onSnapshot(profileRef, (snap) => {
      profileReady = true;
      setData((prev) => ({
        ...prev,
        profile: snap.exists() ? { ...snap.data(), id: snap.id } as UserProfile : null,
        isLoading: !(profileReady && chatsReady)
      }));
    });

    const chatsUnsub = onSnapshot(historyQuery, (snap) => {
      chatsReady = true;
      const chats = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AIConversation));
      setData((prev) => ({
        ...prev,
        chats,
        isLoading: !(profileReady && chatsReady)
      }));
    });

    return () => {
      profileUnsub();
      chatsUnsub();
    };
  }, [userId, db]);

  return data;
}
