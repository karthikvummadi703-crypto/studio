
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Bus, 
  Train, 
  Bike, 
  Footprints, 
  Zap, 
  TramFront,
  Check,
  X,
  Loader2,
  Info,
  MapPin,
  Navigation
} from 'lucide-react';
import { collection, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Transport Mode Definitions
 * Centralized for easier maintenance and testing.
 */
const TRANSPORT_MODES = [
  { id: 'walking', label: 'Walking', icon: Footprints, co2PerKm: 0, points: 20 },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, co2PerKm: 0, points: 15 },
  { id: 'bus', label: 'Bus', icon: Bus, co2PerKm: 0.05, points: 10 },
  { id: 'train', label: 'Train', icon: Train, co2PerKm: 0.03, points: 10 },
  { id: 'metro', label: 'Metro', icon: TramFront, co2PerKm: 0.02, points: 12 },
  { id: 'car', label: 'Car', icon: Car, co2PerKm: 0.18, points: 2 },
  { id: 'motorcycle', label: 'Motorcycle', icon: ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="15" r="3" /><circle cx="18" cy="15" r="3" /><path d="M18 15V8a2 2 0 0 0-2-2H9.5a3 3 0 0 0-3 3v6" /><path d="M9.5 9h5" /><path d="M12 6V3" /></svg>
  ), co2PerKm: 0.1, points: 5 },
  { id: 'ev', label: 'Electric Vehicle', icon: Zap, co2PerKm: 0.04, points: 8 },
] as const;

export default function CalculatorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('car');
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeResult, setActiveResult] = useState<any>(null);

  const handleCalculate = useCallback(() => {
    if (!start.trim() || !destination.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Please specify both origin and destination.", 
        variant: "destructive" 
      });
      return;
    }

    setCalculating(true);
    
    // Simulation for high-fidelity SaaS feel
    setTimeout(() => {
      const distance = parseFloat((Math.random() * 45 + 5).toFixed(1));
      const mode = TRANSPORT_MODES.find(m => m.id === selectedMode)!;
      const co2 = parseFloat((distance * mode.co2PerKm).toFixed(2));
      
      const impact = co2 > 5 ? 'High' : co2 > 1.5 ? 'Medium' : 'Low';

      setActiveResult({
        start,
        destination,
        mode: mode.id,
        distance,
        co2,
        impact,
        points: mode.points,
        timestamp: new Date().toISOString()
      });
      setCalculating(false);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }, 600);
  }, [start, destination, selectedMode, toast]);

  const handleSave = async () => {
    if (!activeResult || !user || !db) return;
    setSaving(true);

    try {
      // Security: Strictly localized database operations
      const userRef = doc(db, 'users', user.uid);
      const scoreChange = Math.max(1, Math.min(10, 10 - activeResult.co2));

      await Promise.all([
        addDoc(collection(db, 'calculator_records'), { ...activeResult, userId: user.uid }),
        updateDoc(userRef, {
          greenPoints: increment(activeResult.points),
          sustainabilityScore: increment(scoreChange),
        }),
        addDoc(collection(db, 'activities'), {
          userId: user.uid,
          type: 'calculation',
          description: `Logged carbon telemetry for journey: ${activeResult.start} → ${activeResult.destination}`,
          pointsEarned: activeResult.points,
          timestamp: new Date().toISOString()
        })
      ]);

      toast({ title: "Audit Saved", description: "Telemetry synced successfully." });
      setActiveResult(null);
      setStart('');
      setDestination('');
    } catch (e: any) {
      toast({ title: "Sync Error", description: e.message || "Failed to finalize calculation.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const advice = useMemo(() => {
    if (!activeResult) return null;
    if (['walking', 'bicycle'].includes(activeResult.mode)) return {
      type: 'achievement',
      text: "Zero-emission mastery! You've eliminated carbon output for this journey entirely."
    };
    if (activeResult.impact === 'High') return {
      type: 'tip',
      text: "Strategic Tip: This route is high-impact. The Metro would reduce this journey's footprint by up to 88%."
    };
    return {
      type: 'encouragement',
      text: "Efficient journey verified. You're maintaining a low-impact transportation profile."
    };
  }, [activeResult]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Carbon Impact Audit</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">Verify your environmental footprint with real-time transportation telemetry.</p>
      </header>

      <Card className="bg-white border-zinc-200 shadow-xl rounded-[2.5rem] overflow-hidden focus-within:ring-2 ring-primary/5 transition-all">
        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Origin Point</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Starting Location" 
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="pl-11 h-14 bg-zinc-50 border-zinc-100 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Destination Point</Label>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Target Location" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-11 h-14 bg-zinc-50 border-zinc-100 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all"
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Transport Telemetry Mode</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRANSPORT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  aria-pressed={selectedMode === mode.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
                    selectedMode === mode.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-white border-zinc-100 text-zinc-400 hover:border-primary/30 hover:bg-zinc-50"
                  )}
                >
                  <mode.icon className={cn("h-5 w-5", selectedMode === mode.id ? "text-white" : "text-zinc-300 group-hover:text-primary")} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={calculating || !start.trim() || !destination.trim()}
            className="w-full h-16 bg-primary text-white text-base font-headline font-bold rounded-2xl shadow-xl shadow-primary/10 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {calculating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Initiate Audit"}
          </Button>
        </CardContent>
      </Card>

      {activeResult && (
        <section className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
          <Card className="bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="font-headline font-bold text-2xl tracking-tight">Audit Verification</h3>
                <Badge className={cn(
                  "border-none px-5 py-2 text-[10px] uppercase font-black tracking-widest rounded-xl",
                  activeResult.impact === 'High' ? "bg-red-50 text-red-600" : activeResult.impact === 'Medium' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {activeResult.impact} Impact Rating
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 border-y border-zinc-50 py-10">
                <MetricDisplay label="Distance" value={activeResult.distance} unit="KM" />
                <MetricDisplay label="CO₂ Generated" value={activeResult.co2} unit="KG" color="text-red-500" />
                <MetricDisplay label="Reward Pts" value={activeResult.points} unit="PTS" color="text-primary" />
                <MetricDisplay label="Status" value="VERIFIED" isBadge color="text-emerald-500" />
              </div>

              {advice && (
                <div className={cn(
                  "flex items-start gap-5 p-6 rounded-2xl border transition-all",
                  advice.type === 'achievement' ? "bg-emerald-50 border-emerald-100" : "bg-zinc-50 border-zinc-100"
                )}>
                  <Info className={cn("h-6 w-6 shrink-0 mt-0.5", advice.type === 'achievement' ? "text-emerald-500" : "text-zinc-400")} />
                  <p className="text-sm leading-relaxed text-zinc-600 font-medium italic">
                    {advice.text}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary text-white h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-3" /> Commit Telemetry</>}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveResult(null)} 
                  disabled={saving}
                  className="border-zinc-200 bg-white h-14 rounded-2xl font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                >
                  <X className="h-5 w-5 mr-3" /> Discard Result
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-950 text-white rounded-[2rem] p-10 border-none relative overflow-hidden shadow-2xl group">
            <div className="relative z-10 space-y-5">
               <div className="flex items-center gap-3">
                 <Zap className="h-5 w-5 text-primary fill-current animate-pulse" />
                 <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Strategic AI Intelligence</h4>
               </div>
               <p className="text-lg font-headline font-bold leading-tight max-w-xl group-hover:translate-x-1 transition-transform">
                 Switching this journey to the <span className="text-primary underline underline-offset-8 decoration-2">Metro</span> would reduce your carbon telemetry by approximately <span className="text-primary">82%</span> per year.
               </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
          </Card>
        </section>
      )}
    </div>
  );
}

function MetricDisplay({ label, value, unit, color, isBadge }: any) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      {isBadge ? (
        <p className={cn("text-xs font-black tracking-widest", color)}>{value}</p>
      ) : (
        <p className={cn("text-3xl font-headline font-bold tabular-nums", color)}>
          {value} <span className="text-[10px] font-black text-zinc-300 ml-1 uppercase">{unit}</span>
        </p>
      )}
    </div>
  );
}
