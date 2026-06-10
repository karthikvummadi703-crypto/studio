
"use client";

import { useMemo } from 'react';
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
  LineChart
} from 'recharts';
import { Trophy, Milestone, Award, CheckCircle2, TrendingDown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProgressPage() {
  const { user } = useUser();
  const db = useFirestore();

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'calculator_records'), 
      where('userId', '==', user.uid), 
      orderBy('timestamp', 'asc')
    );
  }, [db, user]);
  
  const { data: records, isLoading } = useCollection<any>(recordsQuery);

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records.map(r => ({
      date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      emissions: r.co2 || r.totalEmissions || 0,
      goal: 2.5 // Baseline/Goal comparison
    }));
  }, [records]);

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
          <TrendingDown className="h-3 w-3" /> Growth Telemetry
        </div>
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Progress Analytics</h1>
        <p className="text-muted-foreground text-sm">Real-time evolution of your sustainability metrics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="p-10 border-b border-black/5 bg-white/40">
            <CardTitle className="font-headline text-2xl">Carbon Reduction Journey</CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Historical kgCO2e Output</p>
          </CardHeader>
          <CardContent className="h-[450px] p-10">
            {!hasData ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <TrendingDown className="h-12 w-12 text-zinc-300" />
                <p className="text-sm font-bold uppercase tracking-widest">No Telemetry Found</p>
                <p className="text-xs max-w-xs">Complete your first few calculations to see your impact trends.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0,0,0,0.05)', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}
                    itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEm)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="rgba(0,0,0,0.1)" 
                    strokeDasharray="5 5" 
                    dot={false} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="glass-card border-none shadow-lg rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-headline text-lg">Emission Goals</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <GoalItem label="Reduce Journey Impact" progress={hasData ? 65 : 0} />
              <GoalItem label="Active Transport Streak" progress={hasData ? 30 : 0} />
              <GoalItem label="Weekly Goal Target" progress={hasData ? 85 : 0} />
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-lg rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-headline text-lg">Milestone Rewards</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
               <Achievement icon={Award} title="Verified Auditor" date={hasData ? "Unlocked" : "Locked"} color="text-primary" active={hasData} />
               <Achievement icon={Milestone} title="10kg Saved" date="Goal" color="text-emerald-500" />
               <Achievement icon={Sparkles} title="AI Pioneer" date="Active" color="text-primary" active />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GoalItem({ label, progress, completed }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className={cn(completed ? "line-through text-muted-foreground" : "text-foreground")}>{label}</span>
        <span className="text-primary">{completed ? "Done" : `${progress}%`}</span>
      </div>
      <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000", completed ? "bg-primary" : "bg-primary/40")}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function Achievement({ icon: Icon, title, date, color, active }: any) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl transition-all shadow-sm",
      active ? "bg-white border border-zinc-100" : "bg-zinc-50 border border-transparent opacity-40 grayscale"
    )}>
      <div className={cn("p-2.5 rounded-xl bg-primary/10", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-foreground uppercase tracking-tight">{title}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{date}</p>
      </div>
    </div>
  );
}
