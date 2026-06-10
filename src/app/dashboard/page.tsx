
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

  // 1. Data Streams from Firestore - Strictly Isolated by userId
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

  // 2. Derived State
  const points = profile?.greenPoints || 0;
  const score = profile?.sustainabilityScore || 0;
  const level = getLevelFromPoints(points);
  
  // KPI Calculations
  const latestCO2 = records?.[0]?.co2 || 0;
  const totalSaved = useMemo(() => {
    if (!records) return 0;
    return records.reduce((acc: number, curr: any) => acc + (curr.co2 < 2 ? (2 - curr.co2) : 0), 0);
  }, [records]);

  // 3. Sequential Challenge Logic
  const activeChallenge = useMemo(() => {
    const completedIds = profile?.completedChallenges || [];
    return CHALLENGES.find(c => !completedIds.includes(c.id)) || null;
  }, [profile]);

  const hasData = !!(records && records.length > 0);

  // Stable date formatting for hydration
  const formattedDate = useMemo(() => {
    if (!mounted) return "";
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [mounted]);

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Leaf className="h-10 w-10 text-primary/20 animate-pulse" />
        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Waking Telemetry Node...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">Welcome Back</p>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            {profile?.fullName || user?.displayName || 'Eco Warrior'}
          </h1>
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-4">
           <Link href="/calculator">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-5 font-bold tracking-widest text-[10px] uppercase shadow-lg shadow-primary/20">
              <Calculator className="h-4 w-4 mr-2" /> New Audit
            </Button>
           </Link>
        </div>
      </section>

      {/* Sustainability Hero Section */}
      <section className="glass-card rounded-[2.5rem] p-12 relative overflow-hidden border-white/40 shadow-xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-8 lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl ring-4 ring-primary/5">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-headline font-bold text-foreground">Environmental Pulse</h2>
                <p className="text-muted-foreground text-sm">Your verified sustainability metrics from Firestore.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <HeroMetric label="Score" value={score.toFixed(0)} color="text-primary" />
              <HeroMetric label="Green Points" value={points.toString()} color="text-emerald-600" />
              <HeroMetric label="Current Level" value={level} color="text-foreground" isSmall />
              <HeroMetric label="Latest Impact" value={latestCO2.toFixed(1)} subValue="KG" color="text-emerald-50" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white/40 rounded-[2rem] border border-white/60 backdrop-blur-xl shadow-sm">
             <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90" aria-hidden="true">
                  <circle className="text-black/5" strokeWidth="10" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                  <circle className="text-primary" strokeWidth="10" strokeDasharray="440" strokeDashoffset={440 * (1 - score / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-headline font-bold text-foreground emerald-glow">{score.toFixed(0)}</span>
                  <span className="text-[9px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Score</span>
                </div>
             </div>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Sustainability Rating</p>
          </div>
        </div>
      </section>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass-card border-none rounded-[2rem] overflow-hidden p-8 flex flex-col justify-between">
              {activeChallenge ? (
                <>
                  <CardHeader className="p-0 mb-8">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-primary border-primary/30 text-[9px] font-bold tracking-widest uppercase mb-2">Active Challenge</Badge>
                        <CardTitle className="text-2xl font-headline font-bold">{activeChallenge.title}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Reward</p>
                        <p className="text-xl font-headline font-bold text-primary">+{activeChallenge.reward} Pts</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <p className="text-muted-foreground text-sm leading-relaxed">{activeChallenge.description}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Progress: 0%</span>
                        <span>7 Days Remaining</span>
                      </div>
                      <Progress value={0} className="h-2 bg-black/5" />
                    </div>
                  </CardContent>
                  <div className="mt-8 pt-6 border-t border-black/5">
                     <Button variant="ghost" className="w-full justify-between text-primary font-bold group hover:bg-primary/5 rounded-xl py-6">
                        Update Progress <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                   <div className="p-4 bg-primary/10 rounded-full"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
                   <h3 className="text-xl font-headline font-bold">All Challenges Complete!</h3>
                   <p className="text-muted-foreground text-sm">You are a true Planet Guardian. Check back soon for new tasks.</p>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-6">
              <KPICard label="Recent Audit" value={latestCO2.toFixed(1)} unit="kg" icon={TrendingDown} color="text-red-500" />
              <KPICard label="Estimated Saved" value={totalSaved.toFixed(1)} unit="kg" icon={Leaf} color="text-emerald-500" />
              <KPICard label="Total Reward" value={points.toString()} unit="pts" icon={Sparkles} color="text-primary" />
              <KPICard label="History Size" value={records.length.toString()} unit="logs" icon={CheckCircle2} color="text-primary" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HeroMetric({ label, value, subValue, color, isSmall }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
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
    <div className="glass-card rounded-2xl p-6 flex items-center justify-between group transition-all hover:bg-white border-none shadow-sm">
       <div className="space-y-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
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
    <Card className="glass-card border-none rounded-[2.5rem] p-12 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
      <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl font-headline font-bold text-foreground tracking-tight">Welcome to EcoPulse AI</h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
          Your environmental footprint is a blank canvas. Complete your first carbon calculation to start tracking your impact and unlock personalized strategies.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
        <Link href="/calculator">
          <Button size="lg" className="h-14 px-10 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
            Start First Calculation
          </Button>
        </Link>
        <Link href="/knowledge-hub">
          <Button size="lg" variant="outline" className="h-14 px-10 border-black/10 text-foreground font-bold rounded-2xl hover:bg-black/5">
            Explore Knowledge Hub
          </Button>
        </Link>
      </div>
    </Card>
  );
}
