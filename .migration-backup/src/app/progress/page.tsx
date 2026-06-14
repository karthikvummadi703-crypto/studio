
"use client";

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui';
import { Trophy, Milestone, Award, TrendingDown, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildUserCalculatorRecordsQuery } from '@/lib/firestore-queries';

const AreaChartComponent = dynamic(() => import('@/components/charts/area-chart'), { 
  ssr: false, 
  loading: () => (
    <div 
      role="status" 
      aria-label="Initialising Analytics"
      className="h-[400px] w-full bg-zinc-50 rounded-2xl animate-pulse flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
    >
      <span className="sr-only">Initialising Analytics chart, please wait...</span>
      Initialising Analytics...
    </div>
  )
});

interface CalculatorRecord {
  co2: number;
  timestamp: { toDate: () => Date } | string | number;
  userId: string;
  id?: string;
}

interface GoalItemProps {
  label: string;
  progress: number;
  completed?: boolean;
}

interface AchievementProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  date: string;
  color: string;
  active?: boolean;
}

export default function ProgressPage() {
  const { user } = useUser();
  const db = useFirestore();

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return buildUserCalculatorRecordsQuery(db, user.uid, { sortOrder: 'asc', limitCount: 50 });
  }, [db, user]);
  
  const { data: records, isLoading } = useCollection<CalculatorRecord>(recordsQuery as any);

  /**
   * Memoized chart data with stable dependency tracking.
   * Uses a composite key (length + first item ID) to ensure recomputations only 
   * occur when the core data set is updated, avoiding overhead from hook reference changes.
   */
  const chartData = useMemo(() => {
    if (!records?.length) return [];
    return records.map((r) => ({
      date: new Date(typeof r.timestamp === 'object' && 'toDate' in r.timestamp ? r.timestamp.toDate() : r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      emissions: Number(r.co2 || 0).toFixed(2),
      goal: 1.5
    }));
  }, [records?.length, records?.[0]?.id]);

  const hasData = useMemo(() => chartData.length > 0, [chartData]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <Spinner className="h-10 w-10 text-primary" label="Synchronizing impact analytics..." />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
          <TrendingDown className="h-3 w-3" /> Growth Telemetry Node
        </div>
        <h1 className="text-5xl font-headline font-bold text-foreground tracking-tighter">Impact Analytics</h1>
        <p className="text-muted-foreground text-base max-w-xl">Deep-dive into your historical environmental telemetry and milestone evolution.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-white border-zinc-200 shadow-sm rounded-[3rem] overflow-hidden group">
          <CardHeader className="p-12 border-b border-zinc-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-headline text-3xl tracking-tight">Carbon Evolution</CardTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Kilograms CO2e Output per Audit</p>
            </div>
            <Target className="h-8 w-8 text-primary/10 group-hover:text-primary/30 transition-colors" />
          </CardHeader>
          <CardContent className="p-12">
            {!hasData ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 opacity-30 select-none">
                <div className="p-6 bg-zinc-100 rounded-[2rem]">
                  <TrendingDown className="h-16 w-16 text-zinc-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.3em]">No Telemetry Detected</p>
                  <p className="text-sm max-w-[240px] leading-relaxed text-zinc-500">Execute at least one impact audit to initialize trend analysis visualization.</p>
                </div>
              </div>
            ) : (
              <AreaChartComponent data={chartData} />
            )}
          </CardContent>
        </Card>

        <aside className="space-y-10">
          <Card className="bg-white border-zinc-200 shadow-sm rounded-[2.5rem] p-10 hover:shadow-md transition-all">
            <CardHeader className="px-0 pt-0 pb-8">
              <CardTitle className="font-headline text-xl tracking-tight flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" /> Core Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-10">
              <GoalItem label="Transport Efficiency" progress={hasData ? 72 : 0} />
              <GoalItem label="Active Habit Streak" progress={hasData ? 45 : 0} />
              <GoalItem label="Weekly Goal Delta" progress={hasData ? 91 : 0} />
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 text-white rounded-[2.5rem] p-10 border-none shadow-2xl relative overflow-hidden">
            <CardHeader className="px-0 pt-0 pb-8">
              <CardTitle className="font-headline text-xl tracking-tight text-white flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-5">
               <Achievement icon={Award} title="Verified Auditor" date="SYNCED" color="text-primary" active={hasData} />
               <Achievement icon={Milestone} title="10KG REDUCED" date="UPCOMING" color="text-emerald-500" />
               <Achievement icon={Sparkles} title="AI STRATEGIST" date="ACTIVE" color="text-primary" active={true} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function GoalItem({ label, progress, completed }: GoalItemProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
        <span className={cn(completed ? "line-through text-zinc-500" : "text-zinc-600")}>{label}</span>
        <span className="text-primary">{completed ? "COMPLETE" : `${progress}%`}</span>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className={cn("h-full transition-all duration-1500 ease-in-out", completed ? "bg-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-primary/40")}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function Achievement({ icon: Icon, title, date, color, active }: AchievementProps) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-500",
      active 
        ? "bg-white/5 border-white/10 shadow-sm hover:bg-white/10 border scale-100" 
        : "bg-white/5 border-transparent opacity-40 grayscale scale-95"
    )}>
      <div className={cn("p-3 rounded-2xl bg-primary/10", color)}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] font-black text-white uppercase tracking-wider">{title}</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{active ? date : 'Locked'}</p>
      </div>
    </div>
  );
}
