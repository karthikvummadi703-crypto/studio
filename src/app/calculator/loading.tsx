import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Carbon Impact Audit node.
 */
export default function CalculatorLoading() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 animate-pulse">
      <Skeleton className="h-10 w-56 mx-auto" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-[2rem]" />
    </div>
  );
}
