import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Knowledge Hub.
 */
export default function KnowledgeLoading() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8 animate-pulse">
      <Skeleton className="h-10 w-56 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
