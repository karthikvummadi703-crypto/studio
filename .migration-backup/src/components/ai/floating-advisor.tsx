"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Minimize2, Maximize2, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, ScrollArea, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLevelFromPoints } from '@/lib/levels';
import { AdvisorMessage } from './advisor-message';
import { AdvisorInput } from './advisor-input';
import type { UserProfile, ChatMessage } from '@/types';

/**
 * Floating persistent AI assistant.
 * Streams AI responses token-by-token for a natural typewriter effect.
 */
export function FloatingAIAdvisor() {
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemo(
    () => (user && db ? doc(db, 'users', user.uid) : null),
    [user, db]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Hello! I am your Gemini-powered advisor. How can I help you reduce your footprint today?',
      timestamp: new Date().toISOString(),
    },
  ]);

  const VISIBLE_MESSAGE_LIMIT = 20;
  const visibleMessages = useMemo(() => messages.slice(-VISIBLE_MESSAGE_LIMIT), [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(
    async (customMsg?: string) => {
      const text = (customMsg || input).trim();
      if (!text || isLoading || !user) return;

      setMessages((prev) => [...prev, { role: 'user', text, timestamp: new Date().toISOString() }]);
      setInput('');
      setIsLoading(true);

      // Optimistically add an empty AI message that we will stream into.
      const aiMsgIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '', timestamp: new Date().toISOString() },
      ]);

      try {
        const prunedHistory = messages.slice(-3).map((m) => ({ role: m.role, text: m.text }));
        const idToken = await user.getIdToken();

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            history: prunedHistory,
            userInput: text,
            userContext: {
              points: profile?.greenPoints || 0,
              score: profile?.sustainabilityScore || 0,
              level: getLevelFromPoints(profile?.greenPoints || 0),
              challengesCompleted: profile?.completedChallenges?.length || 0,
            },
          }),
        });

        if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
        if (!response.body) throw new Error('No response body');

        // Read the stream and append chunks to the last AI message.
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'ai') {
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + chunk,
                };
              }
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('[FloatingAdvisor] Error:', err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'ai',
            text: "I'm sorry, I couldn't get a response. Please try again.",
            timestamp: new Date().toISOString(),
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, user, messages, profile]
  );

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <Card
          className={cn(
            'shadow-2xl border border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-300',
            isExpanded ? 'w-[420px] h-[600px]' : 'w-[340px] h-[480px]'
          )}
          role="dialog"
          aria-label="EcoPulse AI Advisor"
          aria-modal="false"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              EcoPulse Advisor
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? 'Minimize advisor' : 'Expand advisor'}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
                aria-label="Close advisor"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col h-[calc(100%-57px)] p-0">
            <ScrollArea className="flex-1 p-4">
              {visibleMessages.map((msg, i) => (
                <AdvisorMessage key={i} message={msg} />
              ))}
              {isLoading && (
                <div
                  className="flex justify-start mt-2"
                  aria-live="polite"
                  aria-label="Advisor is thinking"
                >
                  <Spinner className="h-5 w-5 text-primary" />
                </div>
              )}
              <div ref={scrollRef} />
            </ScrollArea>

            <div className="p-3 border-t border-border/50 space-y-2">
              <AdvisorInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isLoading={isLoading}
              />
              <div className="flex justify-end">
                <Link
                  href="/ai-advisor"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  Full Advisor
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
        aria-label={isOpen ? 'Close AI advisor' : 'Open AI advisor'}
        aria-expanded={isOpen}
      >
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </Button>
    </div>
  );
}
