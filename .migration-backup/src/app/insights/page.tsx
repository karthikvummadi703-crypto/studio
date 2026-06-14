"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui';
import { Sparkles, Zap, Car, Utensils, ShoppingBag, Send } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { getDocs } from 'firebase/firestore';
import { GenerateReductionPlanOutput } from '@/ai/flows/generate-reduction-plan';
import Link from 'next/link';
import { buildUserCalculatorRecordsQuery } from '@/lib/firestore-queries';
import { getErrorMessage } from '@/lib/handle-error';

const InsightCategoryCard = dynamic(() => import('./insight-card'), { ssr: false });

export default function InsightsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<GenerateReductionPlanOutput | null>(null);
  const [latestRecord, setLatestRecord] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchLatest() {
      if (user && db) {
        const q = buildUserCalculatorRecordsQuery(db, user.uid, { limitCount: 1 });
        const snap = await getDocs(q);
        if (!snap.empty && !controller.signal.aborted) {
          setLatestRecord(snap.docs[0].data());
        }
      }
    }
    fetchLatest();
    return () => controller.abort();
  }, [user, db]);

  const handleGenerate = useCallback(async () => {
    if (!latestRecord) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalEmissions: latestRecord.co2 || 0,
          emissionsBreakdown: latestRecord.breakdown || {
            transportation: latestRecord.co2 || 0,
            homeEnergy: 0,
            food: 0,
            lifestyle: 0
          }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch insights');
      
      const result = await response.json();
      setInsight(result);
    } catch (error: unknown) {
      console.error('[Insights] Generation failed:', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [latestRecord]);

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">AI Strategic Insights</h1>
          <p className="text-zinc-600">Deep analysis and actionable reduction strategies powered by Gemini.</p>
        </div>
        {!insight && latestRecord && (
          <Button onClick={handleGenerate} disabled={loading} size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {loading ? <Spinner className="mr-2 h-4 w-4" label="Generating insights..." /> : <><Sparkles className="mr-2 h-5 w-5" /> Generate My Strategy</>}
          </Button>
        )}
      </div>

      {!latestRecord && !loading && (
        <Card className="bg-white border-dashed border-2 border-zinc-200">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="p-4 bg-zinc-50 rounded-full"><Sparkles className="h-10 w-10 text-zinc-400" /></div>
             <p className="text-xl font-headline font-bold">No Data Found</p>
             <p className="text-zinc-500 max-w-sm"> We need at least one carbon calculation to generate personalized insights.</p>
             <Button asChild variant="outline" className="rounded-xl">
               <Link href="/calculator">Calculate Footprint</Link>
             </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Spinner className="h-12 w-12 text-primary" label="Analyzing your footprint with Gemini AI..." />
          <p className="font-headline text-lg animate-pulse text-zinc-700">Analyzing your footprint with Gemini AI...</p>
        </div>
      )}

      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2 glass-card border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6">
              <Sparkles className="h-10 w-10 text-primary/10" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-foreground">Personalized Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-zinc max-w-none text-zinc-600">
                {insight.personalizedAnalysis}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-foreground">
                <Send className="h-5 w-5 text-primary" />
                Weekly Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">
              {insight.weeklyActionPlan}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-foreground">
                <Zap className="h-5 w-5 text-primary" />
                Monthly Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">
              {insight.monthlyImprovementStrategy}
            </CardContent>
          </Card>

          <Suspense fallback={<div className="h-48 bg-zinc-50 animate-pulse rounded-2xl" />}>
            <InsightCategoryCard title="Transport Recommendations" icon={Car} items={insight.transportationRecommendations} />
            <InsightCategoryCard title="Home Energy" icon={Zap} items={insight.homeEnergyRecommendations} />
            <InsightCategoryCard title="Food & Diet" icon={Utensils} items={insight.foodRecommendations} />
            <InsightCategoryCard title="Lifestyle" icon={ShoppingBag} items={insight.lifestyleRecommendations} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
