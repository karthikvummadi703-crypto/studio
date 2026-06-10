
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Sparkles, 
  TrendingDown, 
  Lightbulb, 
  Globe, 
  Leaf, 
  Zap,
  ArrowUpRight,
  Info,
  Clock
} from 'lucide-react';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const EDUCATIONAL_TOPICS = [
  {
    title: "Carbon Footprint Basics",
    desc: "Understand the core concepts of carbon footprints and why tracking is the first step toward environmental preservation.",
    icon: Globe,
    category: "Essentials",
    readTime: "5 min"
  },
  {
    title: "The Science of Climate",
    desc: "A deep dive into the thermal dynamics of our atmosphere and the impact of greenhouse gas concentration.",
    icon: TrendingDown,
    category: "Science",
    readTime: "8 min"
  },
  {
    title: "Sustainable Daily Life",
    desc: "Actionable micro-habits that lead to macro environmental shifts. Small changes, global impact.",
    icon: Leaf,
    category: "Lifestyle",
    readTime: "4 min"
  },
  {
    title: "Renewable Transitions",
    desc: "How the world is shifting from fossil fuels to clean energy and what role you play in the grid.",
    icon: Zap,
    category: "Energy",
    readTime: "6 min"
  },
  {
    title: "The Zero-Waste Model",
    desc: "Techniques for eliminating personal waste and understanding the circular economy in modern society.",
    icon: Globe,
    category: "Waste",
    readTime: "7 min"
  }
];

export default function KnowledgeHubPage() {
  const { user } = useUser();
  const db = useFirestore();

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'calculator_records'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
  }, [db, user]);

  const { data: latestRecords } = useCollection(recordsQuery);
  const latestRecord = latestRecords?.[0];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
          Knowledge Hub
        </h1>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto">
          Expert guidance and personalized insights for your sustainability journey.
        </p>
      </header>

      <Tabs defaultValue="educational" className="w-full">
        <div className="flex justify-center mb-12">
          <TabsList className="bg-white border border-zinc-200 p-1 rounded-xl h-auto shadow-sm">
            <TabsTrigger 
              value="educational" 
              className="py-2.5 px-6 rounded-lg font-headline text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all"
            >
               <BookOpen className="mr-2 h-4 w-4" /> Educational Library
            </TabsTrigger>
            <TabsTrigger 
              value="personalized" 
              className="py-2.5 px-6 rounded-lg font-headline text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all"
            >
               <Sparkles className="mr-2 h-4 w-4" /> Personalized Impact
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="educational" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EDUCATIONAL_TOPICS.map((topic, i) => (
              <Card key={i} className="bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                <CardHeader className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <topic.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <Clock className="h-3 w-3" /> {topic.readTime}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">{topic.category}</p>
                    <CardTitle className="font-headline text-xl text-foreground group-hover:text-primary transition-colors">
                      {topic.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">
                    {topic.desc}
                  </p>
                  <Button variant="outline" className="w-full h-11 border-zinc-200 text-sm font-bold rounded-xl hover:bg-zinc-50 hover:text-primary transition-all">
                    Read Article <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="personalized" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
          {latestRecord ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Impact Card */}
              <Card className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden h-fit">
                <CardHeader className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-primary" />
                    <CardTitle className="font-headline text-lg">Impact Breakdown</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">
                    Telemetry from {new Date(latestRecord.timestamp).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="text-center py-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Latest Journey Emission</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-headline font-bold text-foreground">{latestRecord.co?.toFixed(1) || latestRecord.totalEmissions?.toFixed(1) || 0}</span>
                      <span className="text-sm font-bold text-zinc-400 uppercase">kgCO2e</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 mt-2">
                      {latestRecord.start} to {latestRecord.destination}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Journey Distance</span>
                        <span className="text-xs font-bold text-primary">{latestRecord.distance} km</span>
                      </div>
                      <Progress value={Math.min(100, (latestRecord.distance / 100) * 100)} className="h-1.5 bg-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Impact Rating</span>
                        <Badge variant="outline" className="text-[9px] font-black uppercase">{latestRecord.impact} Impact</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights Card */}
              <div className="space-y-6">
                <Card className="bg-zinc-900 text-white rounded-2xl p-8 border-none relative overflow-hidden shadow-xl">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Insight</h4>
                    </div>
                    <p className="text-lg font-headline font-bold leading-relaxed text-zinc-100">
                      {latestRecord.mode === 'car' || latestRecord.mode === 'motorcycle' ? 
                        `Your last trip via ${latestRecord.mode} produced significant emissions. Switching to the metro for this specific route could have saved approximately 82% of that carbon impact.` :
                        `Using ${latestRecord.mode} was an excellent choice. You've avoided approximately 4.5kg of CO2 compared to a standard petrol vehicle for this specific distance.`
                      }
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/10 border border-white/5 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">Top Action</p>
                        <p className="text-sm font-bold">Public Transit Mode</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/10 border border-white/5 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">Efficiency</p>
                        <p className="text-sm font-bold">Route Optimization</p>
                      </div>
                    </div>
                  </div>
                  <Sparkles className="absolute -bottom-6 -right-6 h-32 w-32 text-primary opacity-10" />
                </Card>

                <Card className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                      <Info className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Projection Analysis</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Based on your current habits, choosing public transport for just 2 more trips this week will improve your Sustainability Score by approximately <span className="text-emerald-600 font-bold">15 points</span>.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="bg-white border border-zinc-200 shadow-sm rounded-2xl text-center py-24">
              <CardContent className="space-y-8 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="h-8 w-8 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold text-foreground">Insights Locked</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Complete your first carbon impact audit to unlock hyper-personalized analysis and reduction strategies.
                  </p>
                </div>
                <Link href="/calculator" className="block">
                  <Button className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform">
                    Start Impact Audit
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
