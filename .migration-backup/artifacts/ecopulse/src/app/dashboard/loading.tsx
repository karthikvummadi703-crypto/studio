import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the Dashboard Strategy Node.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-10 animate-pulse" role="status" aria-label="Loading dashboard telemetry" aria-busy="true">
      <span className="sr-only">Synchronizing dashboard node, please wait...</span>
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-[2.5rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-72 rounded-[2rem]" />
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}