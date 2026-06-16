'use client';

import React from 'react';
import { Leaf, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  hasError: boolean;
  message: string;
}

/**
 * A robust Error Boundary component to catch and recover from UI-level crashes.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackMessage?: string },
  State
> {
  constructor(props: { children: React.ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log errors to a service in production if needed
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 p-8 text-center animate-fade-in">
          <div className="p-4 bg-red-50 rounded-2xl shadow-sm border border-red-100">
            <Leaf className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-headline font-bold text-foreground tracking-tight">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-sm font-medium">
              {this.props.fallbackMessage || 'An unexpected error occurred in this environmental node. Please try again.'}
            </p>
          </div>
          <Button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="rounded-xl font-bold px-8 shadow-lg transition-transform hover:scale-105"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
