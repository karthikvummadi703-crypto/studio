
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Zap, Car, Utensils, ShoppingBag, Send } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { generateReductionPlan, GenerateReductionPlanOutput } from '@/ai/flows/generate-reduction-plan';

export default function InsightsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<GenerateReductionPlanOutput | null>(null);
  const [latestRecord, setLatestRecord] = useState<any>(null);

  useEffect(() => {
    async function fetchLatestRecord() {
      if (user && db) {
        const q = query(
          collection(db, 'calculator_records'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLatestRecord(snap.docs[0].data());
        }
      }
    }
    fetchLatestRecord();
  }, [user, db]);

  const handleGenerate = async () => {
    if (!latestRecord) return;
    setLoading(true);
    try {
      const result = await generateReductionPlan({
        totalEmissions: latestRecord.co2 || latestRecord.totalEmissions || 0,
        emissionsBreakdown: latestRecord.breakdown || {
          transportation: latestRecord.co2 || 0,
          homeEnergy: 0,
          food: 0,
          lifestyle: 0
        }
      });
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">AI Strategic Insights</h1>
          <p className="text-muted-foreground">Deep analysis and actionable reduction strategies powered by Gemini.</p>
        </div>
        {!insight && latestRecord && (
          <Button onClick={handleGenerate} disabled={loading} size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> Generate My Strategy</>}
          </Button>
        )}
      </div>

      {!latestRecord && !loading && (
        <Card className="glass-card border-dashed border-2 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="p-4 bg-white/5 rounded-full"><Sparkles className="h-10 w-10 text-muted-foreground" /></div>
             <p className="text-xl font-headline font-bold">No Data Found</p>
             <p className="text-muted-foreground max-w-sm">We need at least one carbon calculation to generate personalized insights.</p>
             <Button asChild variant="outline">
               <a href="/calculator">Calculate Footprint</a>
             </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="font-headline text-lg animate-pulse">Analyzing your footprint with Gemini AI...</p>
        </div>
      )}

      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="lg:col-span-2 glass-card border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6">
              <Sparkles className="h-10 w-10 text-primary/10" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Personalized Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-muted-foreground">
                {insight.personalizedAnalysis}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Weekly Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-wrap">
              {insight.weeklyActionPlan}
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Monthly Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-wrap">
              {insight.monthlyImprovementStrategy}
            </CardContent>
          </Card>

          <InsightCategoryCard 
            title="Transport Recommendations" 
            icon={Car} 
            items={insight.transportationRecommendations} 
          />
          <InsightCategoryCard 
            title="Home Energy" 
            icon={Zap} 
            items={insight.homeEnergyRecommendations} 
          />
          <InsightCategoryCard 
            title="Food & Diet" 
            icon={Utensils} 
            items={insight.foodRecommendations} 
          />
          <InsightCategoryCard 
            title="Lifestyle" 
            icon={ShoppingBag} 
            items={insight.lifestyleRecommendations} 
          />
        </div>
      )}
    </div>
  );
}

function InsightCategoryCard({ title, icon: Icon, items }: any) {
  if (!items || items.length === 0) return null;
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="font-headline">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl bg-white/5 space-y-2">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm">{item.action}</p>
              <Badge variant="outline" className="text-[10px] uppercase">{item.impactLevel} Impact</Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
               <span>Difficulty: {item.difficultyLevel}</span>
               <span className="text-primary font-mono">{item.estimatedCarbonSavings}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
