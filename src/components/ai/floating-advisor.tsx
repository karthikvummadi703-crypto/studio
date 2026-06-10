"use client";

import { useState } from 'react';
import { Sparkles, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function FloatingAIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your EcoPulse Advisor. I can analyze your sustainability habits and suggest ways to reduce your footprint. What would you like to know?' }
  ]);

  const handleSend = async (customMsg?: string) => {
    const text = customMsg || input;
    if (!text.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Based on environmental telemetry, I recommend completing an Impact Audit first. This will allow me to generate precise carbon reduction strategies for your profile." 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Bottom Bar (Trigger) */}
      <div className="fixed bottom-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl border-t border-black/5 flex items-center justify-between px-10 z-40">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsOpen(true)}>
           <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">EcoPulse AI Advisor</p>
              <p className="text-[11px] font-bold text-muted-foreground">Ready to analyze your footprint. Ask me anything.</p>
           </div>
        </div>

        <div className="flex gap-4">
           {['Analyze Impact', 'Reduce Emissions', 'Next Action'].map(prompt => (
              <Button 
                key={prompt}
                variant="outline" 
                size="sm" 
                className="hidden lg:flex h-9 px-4 border-primary/20 bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-full"
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

      {/* Main Drawer */}
      <div className={cn(
        "fixed bottom-20 right-8 z-50 transition-all duration-500 ease-in-out transform",
        isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
        isExpanded ? "w-[500px]" : "w-[380px]"
      )}>
        <Card className={cn(
          "shadow-2xl border-primary/20 glass-card flex flex-col transition-all duration-300 rounded-[2rem] overflow-hidden",
          isExpanded ? "h-[700px]" : "h-[500px]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-black/5 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest text-primary">AI Advisor</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white/50">
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
                        : "bg-white border border-black/5 rounded-tl-none text-foreground"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-[10px] text-primary uppercase font-bold tracking-widest animate-pulse px-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Eco-Engine...
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-5 border-t border-black/5 bg-white/80 flex gap-3">
              <Input 
                placeholder="Type your question..." 
                className="bg-black/5 border-transparent text-xs h-12 rounded-xl focus-visible:ring-primary/20"
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