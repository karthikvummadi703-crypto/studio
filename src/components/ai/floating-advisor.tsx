
"use client";

import { useState, useMemo } from 'react';
import { Sparkles, X, Send, Loader2, Minimize2, Maximize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { aiAdvisorChat } from '@/ai/flows/ai-advisor-chat';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLevelFromPoints } from '@/lib/levels';

export function FloatingAIAdvisor() {
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! Ask me about your carbon footprint or sustainability level.' }
  ]);

  const handleSend = async (customMsg?: string) => {
    const text = (customMsg || input).trim();
    if (!text || isLoading) return;
    
    const startTime = performance.now();
    console.log(`[Quick AI] Request started at: ${new Date().toISOString()}`);

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Use pruned history for speed
      const prunedHistory = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));

      const result = await aiAdvisorChat({
        history: prunedHistory,
        userInput: text,
        userContext: {
          points: profile?.greenPoints || 0,
          score: profile?.sustainabilityScore || 0,
          level: getLevelFromPoints(profile?.greenPoints || 0),
          challengesCompleted: profile?.completedChallenges?.length || 0,
        }
      });
      
      setMessages(prev => [...prev, { role: 'ai', text: result.responseText }]);
      console.log(`[Quick AI] Latency: ${(performance.now() - startTime).toFixed(0)}ms`);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'I encountered a brief latency issue. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl border-t border-black/5 flex items-center justify-between px-10 z-40 transition-all duration-300">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsOpen(true)}>
           <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Quick Assistant</p>
              <p className="text-[11px] font-bold text-muted-foreground">Ready to analyze. Click to chat.</p>
           </div>
        </div>

        <div className="flex gap-4">
           {['Analyze Impact', 'Reduce Emissions'].map(prompt => (
              <Button 
                key={prompt}
                variant="outline" 
                size="sm" 
                className="hidden lg:flex h-9 px-4 border-zinc-200 bg-white text-zinc-500 text-[9px] font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all rounded-full"
                onClick={() => {
                  setIsOpen(true);
                  handleSend(prompt);
                }}
              >
                {prompt}
              </Button>
           ))}
        </div>
      </div>

      <div className={cn(
        "fixed bottom-20 right-8 z-50 transition-all duration-300 transform",
        isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
        isExpanded ? "w-[500px]" : "w-[380px]"
      )}>
        <Card className={cn(
          "shadow-2xl border-zinc-200 bg-white flex flex-col transition-all duration-300 rounded-[2rem] overflow-hidden",
          isExpanded ? "h-[700px]" : "h-[500px]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">EcoPulse AI</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/ai-advisor" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" title="Open Full Advisor">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[90%] animate-in fade-in slide-in-from-bottom-2",
                    m.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-[1.5rem] text-xs leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-primary text-white rounded-tr-none font-medium" 
                        : "bg-zinc-50 border border-zinc-100 rounded-tl-none text-zinc-700"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-[10px] text-primary uppercase font-bold tracking-widest animate-pulse px-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Fast Response...
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-5 border-t border-zinc-100 bg-white flex gap-3">
              <Input 
                placeholder="Ask something..." 
                className="bg-zinc-50 border-transparent text-xs h-12 rounded-xl focus-visible:ring-primary/20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="h-12 w-12 bg-primary shadow-lg shadow-primary/30 hover:scale-105 transition-transform" onClick={() => handleSend()} disabled={isLoading}>
                <Send className="h-5 w-5 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
