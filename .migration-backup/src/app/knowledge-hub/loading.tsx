import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Knowledge Hub.
 */
export default function KnowledgeHubLoading() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading knowledge hub" aria-busy="true">
      <span className="sr-only">Loading environmental education articles, please wait...</span>
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}