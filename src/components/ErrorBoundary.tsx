"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches render errors in its child component tree
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="p-4 bg-red-50 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold text-foreground">Something went wrong</h2>
            <p className="text-zinc-600 max-w-md mx-auto">
              Our environmental node encountered an unexpected state. Try refreshing the page.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="rounded-xl px-8 py-6 font-bold"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reload Strategy Node
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
