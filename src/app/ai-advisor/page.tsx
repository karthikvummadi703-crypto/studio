
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  History, 
  Plus, 
  MessageSquare,
  Zap,
  Leaf,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { aiAdvisorChat } from '@/ai/flows/ai-advisor-chat';
import { getLevelFromPoints } from '@/lib/levels';

export default function AIAdvisorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  const historyQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'ai_conversations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
  }, [db, user]);
  const { data: chats } = useCollection<any>(historyQuery);

  const activeChatRef = useMemo(() => (activeChatId && db ? doc(db, 'ai_conversations', activeChatId) : null), [activeChatId, db]);
  const { data: activeChat } = useDoc<any>(activeChatRef);

  const messages = activeChat?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput('');
  };

  const handleSend = async (customMsg?: string) => {
    const text = (customMsg || input).trim();
    if (!text || !user || !db || loading) return;

    const startTime = performance.now();
    console.log(`[AI Advisor] Request started at: ${new Date().toISOString()}`);

    setLoading(true);
    setInput('');

    // Optimistic UI update: local message display
    const userMessage = { role: 'user', text, timestamp: new Date().toISOString() };
    const currentMessages = [...messages, userMessage];

    try {
      let chatId = activeChatId;

      // 1. Initial save/update (Optimistic UI handled by Firestore sync)
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
          messages: currentMessages,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. AI Execution - Use pruned history (last 5 messages)
      const historyForAI = currentMessages.slice(-5).map(m => ({
        role: m.role as 'user' | 'ai',
        text: m.text
      }));

      const responseStartTime = performance.now();
      const result = await aiAdvisorChat({
        history: historyForAI,
        userInput: text,
        userContext: {
          points: profile?.greenPoints || 0,
          score: profile?.sustainabilityScore || 0,
          level: getLevelFromPoints(profile?.greenPoints || 0),
          challengesCompleted: profile?.completedChallenges?.length || 0,
        }
      });
      const responseEndTime = performance.now();
      
      console.log(`[AI Advisor] Token generation took: ${(responseEndTime - responseStartTime).toFixed(0)}ms`);

      const aiMessage = { role: 'ai', text: result.responseText, timestamp: new Date().toISOString() };
      
      // 3. Final update
      updateDoc(doc(db, 'ai_conversations', chatId), {
        messages: [...currentMessages, aiMessage],
        title: result.suggestedTitle || activeChat?.title || text.substring(0, 30),
        updatedAt: serverTimestamp(),
      });
      
      const totalLatency = performance.now() - startTime;
      console.log(`[AI Advisor] Total Latency: ${totalLatency.toFixed(0)}ms`);

    } catch (e) {
      console.error('Advisor speed error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      <Card className="w-full md:w-80 border border-zinc-200 shadow-sm flex flex-col h-full overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm rounded-[2rem]">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <History className="h-3 w-3" /> History
          </h2>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary rounded-xl" onClick={handleNewChat}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {!chats || chats.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <p className="text-[9px] font-bold uppercase tracking-widest">Workspace Empty</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group flex items-start gap-3",
                    activeChatId === chat.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                  )}
                >
                  <MessageSquare className={cn("h-4 w-4 mt-0.5 shrink-0", activeChatId === chat.id ? "text-primary-foreground" : "text-zinc-300 group-hover:text-primary")} />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold truncate">{chat.title}</p>
                    <p className={cn("text-[9px] uppercase tracking-tighter mt-0.5", activeChatId === chat.id ? "text-primary-foreground/60" : "text-zinc-400")}>
                      {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex-1 border border-zinc-200 shadow-sm flex flex-col h-full overflow-hidden bg-white/80 backdrop-blur-sm rounded-[2rem]">
        <CardHeader className="p-6 border-b border-zinc-100 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-headline font-bold">EcoPulse Advisor</CardTitle>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">High Speed Engine</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1">
            Gemini Flash 1.5
          </Badge>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6 md:p-10">
            {messages.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center ring-8 ring-primary/5">
                  <Leaf className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-headline font-bold text-zinc-800">Environmental Workspace</h3>
                  <p className="text-zinc-500 max-w-sm text-sm">
                    Instant strategic insights for your footprint.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                  {[
                    'Analyze My Carbon Footprint',
                    'How can I earn more points?',
                    'Suggest a reduction plan',
                    'Recommend Next Challenge'
                  ].map(prompt => (
                    <Button 
                      key={prompt} 
                      variant="outline" 
                      className="h-auto p-4 justify-start text-left border-zinc-200 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all"
                      onClick={() => handleSend(prompt)}
                    >
                      <Zap className="h-4 w-4 mr-3 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex gap-4 group animate-in fade-in slide-in-from-bottom-2",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      m.role === 'user' ? "bg-zinc-100" : "bg-primary"
                    )}>
                      {m.role === 'user' ? <UserIcon className="h-5 w-5 text-zinc-400" /> : <Sparkles className="h-5 w-5 text-white" />}
                    </div>
                    <div className={cn(
                      "p-6 rounded-[2rem] text-sm leading-relaxed max-w-[80%] shadow-sm border",
                      m.role === 'user' 
                        ? "bg-white border-zinc-100 rounded-tr-none text-foreground" 
                        : "bg-primary/5 border-primary/10 rounded-tl-none text-foreground font-medium"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-6 md:p-8 border-t border-zinc-100 bg-white/50">
            <div className="max-w-4xl mx-auto relative group">
              <Input 
                placeholder="Ask about your footprint..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
                className="h-16 pl-6 pr-20 bg-white border-zinc-200 rounded-[1.5rem] shadow-xl shadow-black/5 focus-visible:ring-primary/20 text-sm"
              />
              <Button 
                size="icon" 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-primary hover:scale-105 transition-transform shadow-lg shadow-primary/20 rounded-xl"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
