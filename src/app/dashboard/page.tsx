"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { doc, query, collection, limit, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Zap, 
  TrendingDown, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  Calculator, 
  Sparkles,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CHALLENGES } from '@/lib/challenges';
import { getLevelFromPoints } from '@/lib/levels';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Memoized Data Queries
  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  const activitiesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'activities'), 
      where('userId', '==', user.uid), 
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [db, user]);
  const { data: activities } = useCollection<any>(activitiesQuery);

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'calculator_records'), 
      where('userId', '==', user.uid), 
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [db, user]);
  const { data: records } = useCollection<any>(recordsQuery);

  // 2. Optimized Derived State
  const stats = useMemo(() => {
    const points = profile?.greenPoints || 0;
    const score = profile?.sustainabilityScore || 0;
    const latestCO2 = records?.[0]?.co2 || 0;
    const totalSaved = records?.reduce((acc: number, curr: any) => acc + (curr.co2 < 2 ? (2 - curr.co2) : 0), 0) || 0;
    
    return {
      points,
      score,
      level: getLevelFromPoints(points),
      latestCO2,
      totalSaved,
      hasRecords: !!(records && records.length > 0)
    };
  }, [profile, records]);

  const activeChallenge = useMemo(() => {
    const completedIds = profile?.completedChallenges || [];
    return CHALLENGES.find(c => !completedIds.includes(c.id)) || null;
  }, [profile]);

  const formattedDate = useMemo(() => {
    if (!mounted) return "";
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric'
    });
  }, [mounted]);

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em]">Strategy Node Alpha</p>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            {profile?.fullName || user?.displayName || 'Eco Explorer'}
          </h1>
          <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-4">
           <Link href="/calculator">
            <Button size="sm" className="bg-primary text-primary-foreground hover:scale-105 transition-all rounded-xl px-6 py-5 font-bold tracking-widest text-[10px] uppercase shadow-lg shadow-primary/20">
              <Calculator className="h-4 w-4 mr-2" /> New Audit
            </Button>
           </Link>
        </div>
      </section>

      {/* Sustainability Metrics Hero */}
      <section className="bg-white/20 backdrop-blur-xl rounded-[2.5rem] p-10 relative overflow-hidden border border-white/40 shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
          <div className="lg:col-span-3 space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl ring-4 ring-primary/5">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold text-foreground">Environmental Pulse</h2>
                <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest text-[10px]">Active Telemetry Verified</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <HeroMetric label="Eco Score" value={stats.score.toFixed(0)} color="text-primary" />
              <HeroMetric label="Green Pts" value={stats.points.toString()} color="text-emerald-600" />
              <HeroMetric label="Status" value={stats.level} color="text-foreground" isSmall />
              <HeroMetric label="Latest Audit" value={stats.latestCO2.toFixed(1)} subValue="KG" color="text-zinc-600" />
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center space-y-4 p-8 bg-white/40 rounded-[2.5rem] border border-white/60 shadow-xl">
             <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle className="text-zinc-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                  <circle className="text-primary" strokeWidth="8" strokeDasharray="351" strokeDashoffset={351 * (1 - stats.score / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-headline font-bold text-foreground">{stats.score.toFixed(0)}</span>
                  <span className="text-[8px] font-black text-muted-foreground tracking-widest uppercase">Score</span>
                </div>
             </div>
             <Badge variant="outline" className="bg-white/80 border-primary/20 text-primary text-[9px] font-black uppercase px-4 py-1">Operational</Badge>
          </div>
        </div>
      </section>

      {!stats.hasRecords ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-white/40 backdrop-blur-xl border-white/60 rounded-[2rem] overflow-hidden p-8 flex flex-col justify-between shadow-xl">
            {activeChallenge ? (
              <>
                <CardHeader className="p-0 mb-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge className="bg-primary text-white text-[9px] font-black tracking-[0.2em] uppercase mb-2">Priority Task</Badge>
                      <CardTitle className="text-2xl font-headline font-bold">{activeChallenge.title}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Incentive</p>
                      <p className="text-xl font-headline font-bold text-primary">+{activeChallenge.reward} PTS</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">{activeChallenge.description}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Sync Progress: 0%</span>
                      <span>Nodes Remaining: 1</span>
                    </div>
                    <Progress value={5} className="h-2 bg-black/5" />
                  </div>
                </CardContent>
                <div className="mt-8 pt-6 border-t border-black/5">
                   <Button variant="ghost" className="w-full justify-between text-primary font-bold group hover:bg-primary/5 rounded-xl py-6">
                      Update Telemetry <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                 <div className="p-4 bg-primary/10 rounded-full"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
                 <h3 className="text-xl font-headline font-bold">All Goals Completed</h3>
                 <p className="text-muted-foreground text-sm">Synchronizing new environment tasks shortly.</p>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <KPICard label="Est. Saved" value={stats.totalSaved.toFixed(1)} unit="KG" icon={TrendingDown} color="text-emerald-500" />
            <KPICard label="Reward Pool" value={stats.points.toString()} unit="PTS" icon={Sparkles} color="text-primary" />
            
            <Card className="bg-zinc-900 text-white rounded-[2rem] p-6 border-none shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-3">
                 <div className="flex items-center gap-2">
                   <Info className="h-4 w-4 text-primary" />
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-primary">Daily Strategy</h4>
                 </div>
                 <p className="text-xs font-medium leading-relaxed text-zinc-300">
                   Based on your last audit of <span className="text-primary font-bold">{stats.latestCO2}kg</span>, switching your next commute to a <span className="text-white font-bold">Bicycle</span> will increase your score by <span className="text-emerald-400 font-bold">+8%</span>.
                 </p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
  );
}

function HeroMetric({ label, value, subValue, color, isSmall }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-headline font-bold tracking-tighter", isSmall ? "text-xl" : "text-3xl md:text-4xl", color)}>
          {value}
        </span>
        {subValue && <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{subValue}</span>}
      </div>
    </div>
  );
}

function KPICard({ label, value, unit, icon: Icon, color }: any) {
  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 flex items-center justify-between group transition-all hover:bg-white/60 border border-white/40 shadow-xl">
       <div className="space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-headline font-bold text-foreground">{value}</span>
             <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">{unit}</span>
          </div>
       </div>
       <div className={cn("p-3 rounded-xl bg-black/5 transition-transform group-hover:scale-110", color)}>
          <Icon className="h-6 w-6" />
       </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-white/40 backdrop-blur-xl border-white/60 rounded-[2.5rem] p-12 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-primary/5">
        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Environmental Node Initialized</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          Your sustainability telemetry is currently at zero. Complete an impact audit to unlock AI reduction strategies and start earning green points.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link href="/calculator">
          <Button size="lg" className="h-14 px-10 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            Start First Audit
          </Button>
        </Link>
      </div>
    </Card>
  );
}
