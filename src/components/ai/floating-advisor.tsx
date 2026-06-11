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
 * Floating persistent AI assistant for quick sustainability queries.
 */
export function FloatingAIAdvisor() {
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Hello! I am your Gemini-powered advisor. How can I help you reduce your footprint today?', timestamp: new Date().toISOString() }
  ]);

  const VISIBLE_MESSAGE_LIMIT = 20;
  const visibleMessages = useMemo(() => messages.slice(-VISIBLE_MESSAGE_LIMIT), [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText]);

  const handleSend = useCallback(async (customMsg?: string) => {
    const text = (customMsg || input).trim();
    if (!text || isLoading || !user) return;
    
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date().toISOString() }]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const prunedHistory = messages.slice(-3).map(m => ({ role: m.role, text: m.text }));
      const idToken = await user.getIdToken();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          history: prunedHistory,
          userInput: text,
          userContext: {
            points: profile?.greenPoints || 0,
            score: profile?.sustainabilityScore || 0,
            level: getLevelFromPoints(profile?.greenPoints || 0),
            challengesCompleted: profile?.completedChallenges?.length || 0,
          }
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: fullResponse, timestamp: new Date().toISOString() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Service busy. Please visit Full Advisor page.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }, [input, isLoading, messages, profile, user]);

  return (
    <>
      <div className="fixed bottom-0 left-64 right-0 h-16 bg-white/95 border-t border-black/5 flex items-center justify-between px-10 z-40">
        <button 
          className="flex items-center gap-4 group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 outline-none" 
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={isOpen ? "Close AI Advisor" : "Open AI Advisor"}
          aria-expanded={isOpen}
          aria-controls="floating-advisor-panel"
        >
           <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
           </div>
           <div className="text-left">
              <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Quick Assistant</p>
              <p className="text-[11px] font-bold text-zinc-600">Gemini Flash Active</p>
           </div>
        </button>

        <div className="flex gap-4">
           {['Analyze Impact', 'Open Full AI Advisor'].map(prompt => (
             prompt === 'Open Full AI Advisor' ? (
                <Link key={prompt} href="/ai-advisor" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="h-9 px-4 border-primary text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-primary/5 transition-all rounded-full">
                    {prompt}
                  </Button>
                </Link>
             ) : (
                <Button 
                  key={prompt}
                  variant="outline" 
                  size="sm" 
                  className="hidden lg:flex h-9 px-4 border-zinc-200 bg-white text-zinc-600 text-[9px] font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all rounded-full"
                  onClick={() => {
                    setIsOpen(true);
                    handleSend(prompt);
                  }}
                >
                  {prompt}
                </Button>
             )
           ))}
        </div>
      </div>

      <div 
        id="floating-advisor-panel"
        className={cn(
          "fixed bottom-20 right-8 z-50 transition-all duration-300 transform",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
          isExpanded ? "w-[500px]" : "w-[380px]"
        )}
      >
        <Card className={cn(
          "shadow-2xl border-zinc-200 bg-white flex flex-col transition-all duration-300 rounded-[2rem] overflow-hidden",
          isExpanded ? "h-[700px]" : "h-[500px]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">AI Quick</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/ai-advisor" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" aria-label="Open Full Advisor">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-500" 
                onClick={() => setIsExpanded(p => !p)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-500" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white">
            <ScrollArea 
              className="flex-1 p-6"
              role="log"
              aria-live="polite"
              aria-label="AI conversation history"
              aria-atomic="false"
            >
              <div className="space-y-6">
                {messages.length > VISIBLE_MESSAGE_LIMIT && (
                  <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest py-2">
                    {messages.length - VISIBLE_MESSAGE_LIMIT} earlier messages hidden
                  </p>
                )}
                {visibleMessages.map((m, i) => (
                  <AdvisorMessage key={i} message={m} isUser={m.role === 'user'} />
                ))}
                {streamingText && (
                  <div className="flex flex-col max-w-[90%] items-start animate-fade-in">
                    <div className="p-4 rounded-[1.5rem] rounded-tl-none text-xs leading-relaxed shadow-sm bg-zinc-50 border border-zinc-200 text-zinc-800">
                      {streamingText}
                    </div>
                  </div>
                )}
                {isLoading && !streamingText && (
                  <div className="flex items-center gap-3 text-[10px] text-primary uppercase font-black tracking-widest animate-pulse px-2">
                    <Spinner className="h-4 w-4" label="AI is thinking..." />
                    Thinking...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <AdvisorInput 
              input={input} 
              setInput={setInput} 
              handleSend={handleSend} 
              isLoading={isLoading} 
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
