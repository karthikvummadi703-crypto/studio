"use client";

import { Send } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';

interface AdvisorInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: (customMsg?: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Input bar component for the AI advisor.
 */
export function AdvisorInput({ input, setInput, handleSend, isLoading }: AdvisorInputProps) {
  return (
    <div className="p-5 border-t border-zinc-100 bg-white flex flex-col gap-3">
      <div className="flex gap-3">
        <Input 
          placeholder="Ask Gemini..." 
          aria-label="Message AI Advisor"
          aria-describedby="advisor-send-hint"
          className="bg-zinc-50 border-zinc-200 text-xs h-12 rounded-xl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <Button 
          size="icon" 
          className="h-12 w-12 bg-primary shadow-lg hover:scale-105 transition-transform shrink-0" 
          onClick={() => handleSend()} 
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            <Spinner className="h-5 w-5 text-white" label="Sending message to AI..." />
          ) : (
            <Send className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
      <span id="advisor-send-hint" className="sr-only">
        Press Enter or click Send to submit your message
      </span>
    </div>
  );
}
