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

const TRANSPORT_MODES = [
  { id: 'walking', label: 'Walking', icon: Footprints, co2PerKm: 0, points: 20 },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, co2PerKm: 0, points: 15 },
  { id: 'bus', label: 'Bus', icon: Bus, co2PerKm: 0.05, points: 10 },
  { id: 'train', label: 'Train', icon: Train, co2PerKm: 0.03, points: 10 },
  { id: 'metro', label: 'Metro', icon: TramFront, co2PerKm: 0.02, points: 12 },
  { id: 'car', label: 'Car', icon: 0.18, points: 2 },
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
        title: "Telemetry Error", 
        description: "Origin and Destination points are required.", 
        variant: "destructive" 
      });
      return;
    }

    setCalculating(true);
    
    // Optimized simulation delay for better UX
    setTimeout(() => {
      const distance = parseFloat((Math.random() * 45 + 5).toFixed(1));
      const mode = TRANSPORT_MODES.find(m => m.id === selectedMode)!;
      const co2 = parseFloat((distance * (mode as any).co2PerKm).toFixed(2));
      
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
    }, 400);
  }, [start, destination, selectedMode, toast]);

  const handleSave = async () => {
    if (!activeResult || !user || !db) return;
    setSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      const scoreChange = Math.max(1, Math.min(10, 10 - activeResult.co2));

      // Optimistic writes (no await for background sync)
      addDoc(collection(db, 'calculator_records'), { ...activeResult, userId: user.uid });
      updateDoc(userRef, {
        greenPoints: increment(activeResult.points),
        sustainabilityScore: increment(scoreChange),
      });
      addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'calculation',
        description: `Logged journey: ${activeResult.start} → ${activeResult.destination}`,
        pointsEarned: activeResult.points,
        timestamp: new Date().toISOString()
      });

      toast({ title: "Audit Synchronized", description: "Environmental telemetry updated successfully." });
      setActiveResult(null);
      setStart('');
      setDestination('');
    } catch (e: any) {
      toast({ title: "Sync Error", description: "Failed to finalize calculation node.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight italic">Carbon Impact Audit</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto font-medium">Verify your transportation footprint with real-time telemetry verification.</p>
      </header>

      <Card className="bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Origin Point</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Sync Origin" 
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="pl-11 h-14 bg-white/60 border-white/40 rounded-2xl focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Destination Node</Label>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Sync Destination" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-11 h-14 bg-white/60 border-white/40 rounded-2xl focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transport Mode Telemetry</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRANSPORT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
                    selectedMode === mode.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-white/40 border-white/40 text-zinc-500 hover:bg-white/60"
                  )}
                >
                  {typeof mode.icon === 'function' ? <mode.icon className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                  <span className="text-[10px] font-black uppercase tracking-tight">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={calculating || !start.trim() || !destination.trim()}
            className="w-full h-16 bg-primary text-white text-base font-headline font-bold rounded-2xl shadow-xl shadow-primary/10 hover:opacity-95 hover:scale-[1.01] transition-all"
          >
            {calculating ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : "Initiate Impact Audit"}
          </Button>
        </CardContent>
      </Card>

      {activeResult && (
        <section className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-10">
          <Card className="bg-white/60 backdrop-blur-2xl border-white/80 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="font-headline font-bold text-2xl tracking-tight italic">Audit Verification</h3>
                <Badge className={cn(
                  "border-none px-5 py-2 text-[10px] font-black tracking-widest rounded-xl uppercase",
                  activeResult.impact === 'High' ? "bg-red-500 text-white" : activeResult.impact === 'Medium' ? "bg-orange-500 text-white" : "bg-primary text-white"
                )}>
                  {activeResult.impact} Impact Verified
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 border-y border-black/5 py-10">
                <MetricDisplay label="Total Dist" value={activeResult.distance} unit="KM" />
                <MetricDisplay label="CO₂ Generated" value={activeResult.co2} unit="KG" color="text-red-500" />
                <MetricDisplay label="Reward Credit" value={activeResult.points} unit="PTS" color="text-primary" />
                <MetricDisplay label="Node Status" value="ACTIVE" isBadge color="text-emerald-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Telemetry"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveResult(null)} 
                  disabled={saving}
                  className="border-zinc-200 bg-white h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  Discard Data
                </Button>
              </div>
            </div>
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
        <p className={cn("text-[10px] font-black tracking-widest uppercase", color)}>{value}</p>
      ) : (
        <p className={cn("text-3xl font-headline font-bold tabular-nums", color)}>
          {value} <span className="text-[10px] font-black text-zinc-300 ml-1 uppercase">{unit}</span>
        </p>
      )}
    </div>
  );
}
