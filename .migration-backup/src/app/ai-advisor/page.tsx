
"use client";

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Send, 
  History, 
  Plus, 
  MessageSquare,
  Zap,
  Leaf,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, ScrollArea, Badge, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getLevelFromPoints } from '@/lib/levels';
import { useAdvisorData } from '@/hooks/use-advisor-data';
import { ChatMessage as IChatMessage, AIConversation } from '@/types';
import { getErrorMessage } from '@/lib/handle-error';

/**
 * Individual chat message bubble component.
 */
const ChatMessage = memo(({ message, isUser }: { message: IChatMessage, isUser: boolean }) => (
  <div className={cn(
    "flex gap-4 group animate-fade-in",
    isUser ? "flex-row-reverse" : "flex-row"
  )}>
    <div className={cn(
      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
      isUser ? "bg-zinc-100" : "bg-primary"
    )}>
      {isUser ? <UserIcon className="h-5 w-5 text-zinc-500" /> : <Sparkles className="h-5 w-5 text-white" />}
    </div>
    <div className={cn(
      "p-6 rounded-[2rem] text-sm leading-relaxed max-w-[80%] shadow-sm border",
      isUser 
        ? "bg-white border-zinc-200 rounded-tr-none text-foreground" 
        : "bg-primary/5 border-primary/10 rounded-tl-none text-foreground font-medium"
    )}>
      {message.text}
    </div>
  </div>
));
ChatMessage.displayName = 'ChatMessage';

/**
 * Full-page AI Advisor interface with history and streaming responses.
 */
export default function AIAdvisorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { profile, chats, isLoading } = useAdvisorData(user?.uid, db);

  const activeChat = useMemo(() => chats.find((c: AIConversation) => c.id === activeChatId), [chats, activeChatId]);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  const VISIBLE_LIMIT = 50;
  const visibleMessages = useMemo(() => messages.slice(-VISIBLE_LIMIT), [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  /**
   * Resets the active chat state to start a new conversation.
   */
  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setInput('');
    setError(null);
  }, []);

  /**
   * Sends a user message to the AI and manages the response stream.
   * @param customMsg Optional message override (for suggestion buttons).
   */
  const handleSend = useCallback(async (customMsg?: string) => {
    const text = (customMsg || input).trim();
    if (!text || !user || !db || loading) return;

    setLoading(true);
    setInput('');
    setStreamingText('');
    setError(null);

    const userMessage: IChatMessage = { role: 'user', text, timestamp: new Date().toISOString() };
    const historyForAI = messages.slice(-5).map((m: IChatMessage) => ({
      role: m.role,
      text: m.text
    }));

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const docRef = await addDoc(collection(db, 'ai_conversations'), {
          userId: user.uid,
          title: text.substring(0, 30),
          messages: [userMessage],
          updatedAt: serverTimestamp(),
        });
        chatId = docRef.id;
        setActiveChatId(chatId);
      } else {
        updateDoc(doc(db, 'ai_conversations', chatId), {
          messages: [...messages, userMessage],
          updatedAt: serverTimestamp(),
        });
      }

      const idToken = await user.getIdToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          history: historyForAI,
          userInput: text,
          userContext: {
            points: profile?.greenPoints || 0,
            score: profile?.sustainabilityScore || 0,
            level: getLevelFromPoints(profile?.greenPoints || 0),
            challengesCompleted: profile?.completedChallenges?.length || 0,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to reach AI service');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream available');

      let fullAIResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        fullAIResponse += chunk;
        setStreamingText(fullAIResponse);
      }

      const aiMessage: IChatMessage = { role: 'ai', text: fullAIResponse, timestamp: new Date().toISOString() };
      updateDoc(doc(db, 'ai_conversations', chatId), {
        messages: [...messages, userMessage, aiMessage],
        updatedAt: serverTimestamp(),
      });

    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }, [input, user, db, loading, messages, activeChatId, profile]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" role="status" aria-live="polite">
        <Spinner className="h-10 w-10 text-primary" label="Loading strategic advisor..." />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-fade-in">
      <Card className="w-full md:w-80 flex flex-col h-full overflow-hidden shrink-0 bg-white border border-zinc-100 shadow-sm rounded-[2rem]">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
            <History className="h-3 w-3" /> History
          </h2>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-primary rounded-xl" 
            onClick={handleNewChat}
            aria-label="Start new chat"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2" aria-label="Conversation history">
            {chats.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">No Chats Found</p>
              </div>
            ) : (
              chats.map((chat: AIConversation) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id!)}
                  aria-pressed={activeChatId === chat.id}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    activeChatId === chat.id 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-primary/5 text-zinc-500 hover:text-primary"
                  )}
                >
                  <MessageSquare className={cn("h-4 w-4 mt-0.5 shrink-0", activeChatId === chat.id ? "text-primary-foreground" : "text-zinc-500 group-hover:text-primary")} />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold truncate">{chat.title || 'Conversation'}</p>
                    <p className={cn("text-[9px] uppercase tracking-tighter mt-0.5 font-black", activeChatId === chat.id ? "text-primary-foreground/80" : "text-zinc-500")}>
                      {(chat.updatedAt as any)?.toDate ? (chat.updatedAt as any).toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </nav>
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col h-full overflow-hidden bg-white border border-zinc-100 shadow-sm rounded-[2rem]">
        <CardHeader className="p-6 border-b border-zinc-100 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary rounded-2xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-headline font-bold">EcoPulse Advisor</CardTitle>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Analytics</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1">
            Gemini Flash
          </Badge>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6 md:p-10">
            {messages.length === 0 && !loading && !streamingText ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto" aria-hidden="true">
                  <Leaf className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-headline font-bold text-zinc-800">Strategy Engine</h3>
                  <p className="text-zinc-600 max-w-sm text-sm font-medium">
                    Personalized environmental advice based on your current telemetry.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                  {[
                    'Analyze My Carbon Footprint',
                    'Suggest Ways To Reduce Emissions',
                    'Recommend My Next Challenge',
                    'Explain My Sustainability Score'
                  ].map(prompt => (
                    <Button 
                      key={prompt} 
                      variant="outline" 
                      className="h-auto p-4 justify-start text-left border-zinc-200 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all outline-none"
                      onClick={() => handleSend(prompt)}
                      aria-label={`Ask: ${prompt}`}
                    >
                      <Zap className="h-4 w-4 mr-3 text-primary" aria-hidden="true" />
                      <span className="text-[11px] font-black uppercase tracking-tight">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto" role="log" aria-live="polite" aria-label="Advisor conversation history">
                {messages.length > VISIBLE_LIMIT && (
                  <p className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest py-4">
                    {messages.length - VISIBLE_LIMIT} earlier messages hidden
                  </p>
                )}
                {visibleMessages.map((m: IChatMessage, i: number) => (
                  <ChatMessage key={i} message={m} isUser={m.role === 'user'} />
                ))}
                
                {streamingText && (
                  <div className="flex gap-4 flex-row animate-fade-in" role="status" aria-live="polite">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="p-6 rounded-[2rem] rounded-tl-none text-sm leading-relaxed max-w-[80%] shadow-sm border bg-primary/5 border-primary/10 text-foreground font-medium" >
                      {streamingText}
                    </div>
                  </div>
                )}

                {loading && !streamingText && (
                  <div className="flex gap-4 animate-pulse" role="status" aria-live="polite" aria-label="AI Generating response">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3">
                      <Spinner className="h-4 w-4" label="Generating response..." />
                      Thinking...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-black uppercase tracking-widest" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                    <Button variant="ghost" className="ml-auto h-7 text-[10px] uppercase font-black" onClick={() => handleSend()}>Retry</Button>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-6 md:p-8 border-t border-zinc-100">
            <div className="max-w-4xl mx-auto relative group">
              <Input 
                placeholder="Ask about your footprint..." 
                aria-label="Advisor query"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
                className="h-16 pl-6 pr-20 bg-white border-zinc-200 rounded-[1.5rem] shadow-sm text-sm font-medium"
              />
              <Button 
                size="icon" 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Send query"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-primary hover:scale-105 transition-transform shadow-lg rounded-xl"
              >
                {loading ? <Spinner className="h-5 w-5" label="Sending query..." /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
