import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Carbon Impact Audit node.
 */
export default function CalculatorLoading() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading calculator content" aria-busy="true">
      <span className="sr-only">Synchronizing calculator telemetry, please wait...</span>
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-[2rem]" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}