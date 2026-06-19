import { Skeleton } from '@/components/ui/skeleton';

/**
 * High-performance skeleton loader for the AI Advisor interface.
 */
export default function AdvisorLoading() {
  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] animate-pulse" role="status" aria-label="Loading AI Advisor" aria-busy="true">
      <span className="sr-only">Initializing strategic advisor, please wait...</span>
      <Skeleton className="w-full md:w-72 h-full rounded-[2rem]" />
      <Skeleton className="flex-1 h-full rounded-[2rem]" />
    </div>
  );
}