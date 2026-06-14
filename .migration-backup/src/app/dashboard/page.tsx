"use client";

import { useMemo, memo } from 'react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui';
import { 
  Leaf, 
  TrendingDown, 
  Calculator, 
  Sparkles,
  Info,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CHALLENGES } from '@/lib/challenges';
import { getLevelFromPoints } from '@/lib/levels';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import type { CarbonRecord } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface HeroMetricProps {
  label: string;
  value: string;
  subValue?: string;
  color: string;
  isSmall?: boolean;
  statusLabel?: string;
}

const HeroMetric = memo(({ label, value, subValue, color, isSmall, statusLabel }: HeroMetricProps) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className={cn("font-headline font-bold tracking-tighter", isSmall ? "text-xl" : "text-3xl md:text-4xl", color)}>
        {value}
        {statusLabel && <span className="sr-only"> ({statusLabel})</span>}
      </span>
      {subValue && <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{subValue}</span>}
    </div>
  </div>
));
HeroMetric.displayName = 'HeroMetric';

interface KPICardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const KPICard = memo(({ label, value, unit, icon: Icon, color }: KPICardProps) => (
  <div className="bg-white rounded-2xl p-6 flex items-center justify-between group transition-all border border-zinc-100 shadow-sm">
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
));
KPICard.displayName = 'KPICard';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const { profile, records, isLoading } = useDashboardData(user?.uid, db);

  const stats = useMemo(() => {
    const points = profile?.greenPoints || 0;
    const score = profile?.sustainabilityScore || 0;
    const latestCO2 = records?.[0]?.co2 || 0;
    const totalSaved = records?.reduce((acc: number, curr: CarbonRecord) => acc + (curr.co2 < 2 ? (2 - curr.co2) : 0), 0) || 0;
    
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <Spinner className="h-10 w-10 text-primary" label="Synchronizing node telemetry..." />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em]">Strategy Node Alpha</p>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            {profile?.fullName || user?.displayName || 'Eco Explorer'}
          </h1>
        </div>
        <div className="flex gap-4">
           <Link href="/calculator">
            <Button size="sm" className="bg-primary text-primary-foreground hover:scale-105 transition-all rounded-xl px-6 py-5 font-bold tracking-widest text-[10px] uppercase shadow-lg shadow-primary/20">
              <Calculator className="h-4 w-4 mr-2" /> New Audit
            </Button>
           </Link>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-10 relative overflow-hidden border border-zinc-100 shadow-sm">
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
              <HeroMetric 
                label="Eco Score" 
                value={stats.score.toFixed(0)} 
                color="text-primary" 
                statusLabel={stats.score >= 70 ? 'good' : stats.score >= 40 ? 'average' : 'needs improvement'}
              />
              <HeroMetric 
                label="Green Pts" 
                value={stats.points.toString()} 
                color="text-emerald-600" 
                statusLabel="green points earned"
              />
              <HeroMetric label="Status" value={stats.level} color="text-foreground" isSmall />
              <HeroMetric label="Latest Audit" value={stats.latestCO2.toFixed(1)} subValue="KG" color="text-zinc-500" />
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-sm">
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
             <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[9px] font-black uppercase px-4 py-1">Operational</Badge>
          </div>
        </div>
      </section>

      {!stats.hasRecords ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-white border-zinc-100 rounded-[2rem] overflow-hidden p-8 flex flex-col justify-between shadow-sm">
            {activeChallenge ? (
              <>
                <CardHeader className="p-0 mb-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge className="bg-primary text-white text-[9px] font-black tracking-[0.2em] uppercase mb-2">Priority Task</Badge>
                      <CardTitle className="text-2xl font-headline font-bold text-foreground">{activeChallenge.title}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Incentive</p>
                      <p className="text-xl font-headline font-bold text-primary">+{activeChallenge.reward} PTS</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">{activeChallenge.description}</p>
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
                 <h3 className="text-xl font-headline font-bold text-foreground">All Goals Completed</h3>
                 <p className="text-muted-foreground text-sm font-medium">Synchronizing new environment tasks shortly.</p>
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
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'dashboard-hero');
  return (
    <Card className="bg-white border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[400px]">
      <div className="relative w-full md:w-1/2 min-h-[300px]">
        {heroImage && (
          <Image 
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            priority
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white md:hidden" />
      </div>
      <div className="w-full md:w-1/2 p-12 flex flex-col items-center justify-center text-center space-y-8 bg-white relative z-10">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-primary/5">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">Environmental Node Initialized</h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed font-medium">
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
      </div>
    </Card>
  );
}
