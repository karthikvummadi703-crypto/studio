
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  Trophy, 
  History, 
  Sparkles, 
  Target, 
  Zap, 
  ChevronRight,
  TrendingDown,
  Layout
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import Link from 'next/link';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy, doc, updateDoc, arrayUnion, increment, addDoc } from 'firebase/firestore';
import { getNextChallenge } from '@/lib/challenges';
import { LEVEL_CONFIG, getLevelFromPoints } from '@/lib/levels';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile } = useDoc(profileRef);
  
  const activitiesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5));
  }, [db, user]);
  const { data: activities } = useCollection(activitiesQuery);

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calculator_records'), orderBy('timestamp', 'desc'), limit(1));
  }, [db, user]);
  const { data: latestRecords } = useCollection(recordsQuery);
  const latestRecord = latestRecords?.[0];

  const points = profile?.greenPoints || 0;
  const level = getLevelFromPoints(points);
  const currentLevelConfig = LEVEL_CONFIG[level];
  
  const levelProgress = useMemo(() => {
    if (currentLevelConfig.max === Infinity) return 100;
    return ((points - currentLevelConfig.min) / (currentLevelConfig.max - currentLevelConfig.min)) * 100;
  }, [points, currentLevelConfig]);

  const activeChallenge = useMemo(() => {
    return getNextChallenge(profile?.completedChallenges || []);
  }, [profile?.completedChallenges]);

  const footprintData = useMemo(() => {
    if (!latestRecord) return [
      { name: 'Transport', value: 30, color: '#10b981' },
      { name: 'Energy', value: 40, color: '#3b82f6' },
      { name: 'Food', value: 20, color: '#f59e0b' },
      { name: 'Lifestyle', value: 10, color: '#8b5cf6' },
    ];
    return [
      { name: 'Transport', value: latestRecord.breakdown.transportation, color: '#10b981' },
      { name: 'Energy', value: latestRecord.breakdown.homeEnergy, color: '#3b82f6' },
      { name: 'Food', value: latestRecord.breakdown.food, color: '#f59e0b' },
      { name: 'Lifestyle', value: latestRecord.breakdown.lifestyle, color: '#8b5cf6' },
    ];
  }, [latestRecord]);

  const handleCompleteChallenge = async () => {
    if (!profileRef || !activeChallenge || !user) return;
    
    updateDoc(profileRef, {
      completedChallenges: arrayUnion(activeChallenge.id),
      greenPoints: increment(activeChallenge.reward)
    });

    addDoc(collection(db, 'activities'), {
      userId: user.uid,
      type: 'challenge',
      description: `Completed Challenge: ${activeChallenge.title}`,
      pointsEarned: activeChallenge.reward,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">
            Welcome, {profile?.fullName?.split(' ')[0] || 'Eco-Explorer'}
          </h1>
          <p className="text-muted-foreground text-lg">Your journey to a net-zero future starts here.</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-card px-5 py-2.5 rounded-2xl flex items-center gap-3 border-primary/20">
            <div className="p-1.5 bg-primary/20 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">Level</p>
              <p className="font-headline font-bold text-lg leading-none">{level}</p>
            </div>
          </div>
          <div className="glass-card px-5 py-2.5 rounded-2xl flex items-center gap-3 border-accent/20">
            <div className="p-1.5 bg-accent/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">Points</p>
              <p className="font-headline font-bold text-lg leading-none text-accent">{points}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Footprint Summary */}
        <Card className="lg:col-span-2 glass-card border-none overflow-hidden shadow-2xl shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-headline text-2xl">Carbon Footprint Summary</CardTitle>
              <CardDescription>Visualizing your current impact audit</CardDescription>
            </div>
            {latestRecord && (
              <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1.5 text-lg font-mono">
                {latestRecord.totalEmissions.toFixed(0)} kg CO2e
              </Badge>
            )}
          </CardHeader>
          <CardContent className="h-[350px]">
            <div className="flex flex-col md:flex-row h-full items-center">
              <ResponsiveContainer width="100%" height="100%" className="md:w-3/5">
                <PieChart>
                  <Pie data={footprintData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value">
                    {footprintData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0c1110', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full md:w-2/5 space-y-4 pr-4 pl-4 md:pl-0">
                {footprintData.map(item => (
                  <div key={item.name} className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground tabular-nums">{item.value.toFixed(0)} kg</span>
                  </div>
                ))}
                {!latestRecord && (
                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full border-primary/20 text-xs h-9">
                      <Link href="/calculator">Start First Calculation</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Challenge */}
        <Card className="glass-card border-none bg-primary/5 border border-primary/10 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Active Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            {activeChallenge ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-background/60 border border-white/5 space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{activeChallenge.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activeChallenge.description}</p>
                  <div className="pt-2">
                    <Badge className="bg-accent/20 text-accent font-bold">+{activeChallenge.reward} Points</Badge>
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground h-11 shadow-lg shadow-primary/20" onClick={handleCompleteChallenge}>
                  Complete & Claim Reward
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg">Master Explorer!</p>
                  <p className="text-sm text-muted-foreground px-6">You've mastered all current challenges. New ones arriving soon.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardContent className="pt-0 pb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1">
                <span>Next Level</span>
                <span>{Math.round(levelProgress)}%</span>
              </div>
              <Progress value={levelProgress} className="h-2 bg-white/5" />
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Score history */}
        <Card className="lg:col-span-2 glass-card border-none shadow-2xl shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Evolution of Impact</CardTitle>
              <CardDescription>Visualizing your sustainability score trends</CardDescription>
            </div>
            <div className="flex gap-2">
               <div className="p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <TrendingDown className="h-4 w-4 text-primary" />
               </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Jan', score: 45 }, { name: 'Feb', score: 52 }, { name: 'Mar', score: profile?.sustainabilityScore || 58 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0c1110', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="score" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {activities && activities.length > 0 ? (
              activities.map((act: any) => (
                <div key={act.id} className="flex gap-4 items-start p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                  <div className={cn(
                    "mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ring-4",
                    act.type === 'calculation' ? "bg-primary ring-primary/10" : "bg-accent ring-accent/10"
                  )} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{act.description}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                      {new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • +{act.pointsEarned} pts
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 opacity-30 italic text-sm flex flex-col items-center gap-3">
                <Layout className="h-10 w-10 text-muted-foreground" />
                No recent activities.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
