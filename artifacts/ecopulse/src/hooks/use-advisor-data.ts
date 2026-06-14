'use client';

import { useMemo, useState, useEffect } from 'react';
import { Firestore, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import type { UserProfile, AIConversation } from '@/types';
import { buildUserConversationsQuery } from '@/lib/firestore-queries';

interface AdvisorData {
  profile: UserProfile | null;
  chats: AIConversation[];
  isLoading: boolean;
}

/**
 * Custom hook that subscribes to the user's AI chat history and reads the shared
 * profile from the global Firebase context to avoid redundant Firestore listeners.
 */
export function useAdvisorData(userId: string | undefined, db: Firestore | undefined): AdvisorData {
  const { profile, isProfileLoading } = useFirebase();
  const [chats, setChats] = useState<AIConversation[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState(true);

  const historyQuery = useMemo(() => {
    if (!userId || !db) return null;
    return buildUserConversationsQuery(db, userId);
  }, [userId, db]);

  useEffect(() => {
    if (!userId || !db || !historyQuery) {
      setChats([]);
      setIsChatsLoading(false);
      return;
    }

    setIsChatsLoading(true);

    const unsubscribe = onSnapshot(
      historyQuery,
      (snap) => {
        const chatsData = snap.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as AIConversation)
        );
        setChats(chatsData);
        setIsChatsLoading(false);
      },
      (error) => {
        console.error('[useAdvisorData] Snapshot error:', error);
        setIsChatsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, db, historyQuery]);

  return {
    profile,
    chats,
    isLoading: isProfileLoading || isChatsLoading,
  };
}
