import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Impact Analytics node.
 */
export default function ProgressLoading() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading analytics content" aria-busy="true">
      <span className="sr-only">Loading analytics telemetry, please wait...</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full rounded-[2rem]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}