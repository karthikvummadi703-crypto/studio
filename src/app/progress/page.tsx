
"use client";

import { useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line,
} from 'recharts';
import { Trophy, Milestone, Award, TrendingDown, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProgressPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Efficiency: Stabilized Firestore Query
  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'calculator_records'), 
      where('userId', '==', user.uid), 
      orderBy('timestamp', 'asc')
    );
  }, [db, user]);
  
  const { data: records, isLoading } = useCollection<any>(recordsQuery);

  // Efficiency: Optimized data processing for charts
  const chartData = useMemo(() => {
    if (!records?.length) return [];
    return records.map(r => ({
      date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      emissions: Number(r.co2 || r.totalEmissions || 0).toFixed(2),
      goal: 2.5 
    }));
  }, [records]);

  const hasData = useMemo(() => chartData.length > 0, [chartData]);

  // Code Quality: Decoupled Achievement component
  const Achievement = useCallback(({ icon: Icon, title, date, color, active }: any) => (
    <div className={cn(
      "flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-500",
      active 
        ? "bg-white border-zinc-100 shadow-sm hover:shadow-md border scale-100" 
        : "bg-zinc-50 border-transparent opacity-40 grayscale scale-95"
    )}>
      <div className={cn("p-3 rounded-2xl bg-primary/10", color)}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] font-black text-foreground uppercase tracking-wider">{title}</p>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{active ? date : 'Locked'}</p>
      </div>
    </div>
  ), []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
          <TrendingDown className="h-3 w-3" /> Growth Telemetry Node
        </div>
        <h1 className="text-5xl font-headline font-bold text-foreground tracking-tighter">Impact Analytics</h1>
        <p className="text-muted-foreground text-base max-w-xl">Deep-dive into your historical environmental telemetry and milestone evolution.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md border-zinc-200 shadow-2xl rounded-[3rem] overflow-hidden group">
          <CardHeader className="p-12 border-b border-zinc-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-headline text-3xl tracking-tight">Carbon Evolution</CardTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Kilograms CO2e Output per Audit</p>
            </div>
            <Target className="h-8 w-8 text-primary/10 group-hover:text-primary/30 transition-colors" />
          </CardHeader>
          <CardContent className="h-[500px] p-12">
            {!hasData ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 select-none">
                <div className="p-6 bg-zinc-100 rounded-[2rem]">
                  <TrendingDown className="h-16 w-16 text-zinc-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.3em]">No Telemetry Detected</p>
                  <p className="text-sm max-w-[240px] leading-relaxed">Execute at least three impact audits to initialize trend analysis visualization.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} 
                    dx={-15}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0,0,0,0.05)', 
                      borderRadius: '24px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                      padding: '16px'
                    }}
                    labelStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#71717a', letterSpacing: '0.1em', marginBottom: '8px' }}
                    itemStyle={{ fontWeight: 800, fontSize: '14px', color: 'hsl(var(--primary))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#chartGradient)" 
                    animationDuration={2000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="#e4e4e7" 
                    strokeWidth={2}
                    strokeDasharray="8 8" 
                    dot={false} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-10">
          <Card className="bg-white border-zinc-200 shadow-xl rounded-[2.5rem] p-10 hover:shadow-2xl transition-all">
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
               <Achievement icon={Sparkles} title="AI STRATEGIST" date="ACTIVE" color="text-primary" active />
            </CardContent>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full" aria-hidden="true" />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function GoalItem({ label, progress, completed }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
        <span className={cn(completed ? "line-through text-zinc-400" : "text-zinc-600")}>{label}</span>
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
