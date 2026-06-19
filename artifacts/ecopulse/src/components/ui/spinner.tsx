import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

/**
 * Reusable loading spinner component with accessible labels.
 */
export function Spinner({ className, label = "Loading, please wait" }: SpinnerProps) {
  return (
    <>
      <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
}
