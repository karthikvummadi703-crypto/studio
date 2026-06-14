"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface AdvisorMessageProps {
  message: ChatMessage;
  isUser: boolean;
}

/**
 * Individual chat message bubble component for the AI advisor.
 */
export const AdvisorMessage = memo(({ message, isUser }: AdvisorMessageProps) => (
  <div className={cn(
    "flex flex-col max-w-[90%] animate-fade-in",
    isUser ? "ml-auto items-end" : "items-start"
  )}>
    <div className={cn(
      "p-4 rounded-[1.5rem] text-xs leading-relaxed shadow-sm",
      isUser 
        ? "bg-primary text-white rounded-tr-none font-medium" 
        : "bg-zinc-50 border border-zinc-200 rounded-tl-none text-zinc-800"
    )}>
      {message.text}
    </div>
  </div>
));

AdvisorMessage.displayName = 'AdvisorMessage';
