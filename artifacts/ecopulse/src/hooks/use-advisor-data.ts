"use client";

import { useMemo, useState, useEffect } from "react";
import { Firestore, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import type { UserProfile, AIConversation } from "@/types";
import { buildUserConversationsQuery } from "@/lib/firestore-queries";

interface AdvisorData {
  profile: UserProfile | null;
  chats: AIConversation[];
  isLoading: boolean;
}

type FirestoreTimestamp = { seconds?: number };

/**
 * Custom hook that subscribes to the user's AI chat history and reads the shared
 * profile from the global Firebase context to avoid redundant Firestore listeners.
 * Conversations are sorted client-side to avoid composite index requirements.
 */
export function useAdvisorData(userId: string | undefined, db: Firestore | undefined): AdvisorData {
  const { profile, isProfileLoading } = useFirebase();
  const [rawChats, setRawChats] = useState<AIConversation[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState(true);

  const historyQuery = useMemo(() => {
    if (!userId || !db) return null;
    return buildUserConversationsQuery(db, userId);
  }, [userId, db]);

  useEffect(() => {
    if (!userId || !db || !historyQuery) {
      setRawChats([]);
      setIsChatsLoading(false);
      return;
    }

    setIsChatsLoading(true);

    const unsubscribe = onSnapshot(
      historyQuery,
      (snap) => {
        const chatsData = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as AIConversation);
        setRawChats(chatsData);
        setIsChatsLoading(false);
      },
      (error) => {
        console.error("[useAdvisorData] Snapshot error:", error);
        setIsChatsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, db, historyQuery]);

  const chats = useMemo(() => {
    return [...rawChats].sort((a, b) => {
      const aS = (a.updatedAt as FirestoreTimestamp)?.seconds ?? 0;
      const bS = (b.updatedAt as FirestoreTimestamp)?.seconds ?? 0;
      return bS - aS;
    });
  }, [rawChats]);

  return {
    profile,
    chats,
    isLoading: isProfileLoading || isChatsLoading,
  };
}
