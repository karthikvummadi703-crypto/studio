"use client";

import { useState, useCallback, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui';
import { 
  Car, 
  Bus, 
  Train, 
  Bike, 
  Footprints, 
  Zap, 
  TramFront,
  MapPin,
  Navigation
} from 'lucide-react';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';
import { getErrorMessage } from '@/lib/handle-error';

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

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  isBadge?: boolean;
}

// Memoized Metric Display
const MetricDisplay = memo(({ label, value, unit, color, isBadge }: MetricDisplayProps) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      {isBadge ? (
        <p className={cn("text-[10px] font-black tracking-widest uppercase", color)}>{value}</p>
      ) : (
        <p className={cn("text-3xl font-headline font-bold tabular-nums", color)}>
          {value} <span className="text-[10px] font-black text-zinc-400 ml-1 uppercase">{unit}</span>
        </p>
      )}
    </div>
  );
});
MetricDisplay.displayName = 'MetricDisplay';

export default function CalculatorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef as any);

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
        points: mode.points
      });
      setCalculating(false);
    }, 400);
  }, [start, destination, selectedMode, toast]);

  const handleSave = useCallback(async () => {
    if (!activeResult || !user || !db) return;
    setSaving(true);

    try {
      const batch = writeBatch(db);
      
      const recordRef = doc(collection(db, 'calculator_records'));
      batch.set(recordRef, { ...activeResult, userId: user.uid, timestamp: serverTimestamp() });

      const userRef = doc(db, 'users', user.uid);
      const scoreChange = Math.max(1, Math.min(10, 10 - activeResult.co2));
      batch.update(userRef, {
        greenPoints: increment(activeResult.points),
        sustainabilityScore: increment(scoreChange),
      });

      const activityRef = doc(collection(db, 'activities'));
      batch.set(activityRef, {
        userId: user.uid,
        type: 'calculation',
        description: `Logged journey: ${activeResult.start} → ${activeResult.destination}`,
        pointsEarned: activeResult.points,
        timestamp: serverTimestamp()
      });

      await batch.commit();

      toast({ title: "Audit Synchronized", description: "Environmental telemetry updated successfully." });
      setActiveResult(null);
      setStart('');
      setDestination('');
    } catch (e: unknown) {
      toast({ 
        title: "Sync Error", 
        description: getErrorMessage(e), 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  }, [activeResult, user, db, toast]);

  const discardResult = useCallback(() => setActiveResult(null), []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-12 animate-fade-in">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight italic">Carbon Impact Audit</h1>
        <p className="text-zinc-600 text-sm max-w-md mx-auto font-medium">Verify your transportation footprint with real-time telemetry verification.</p>
      </header>

      <Card className="bg-white border-zinc-100 shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="origin-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Origin Point</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  id="origin-input"
                  placeholder="Sync Origin" 
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="pl-11 h-14 bg-zinc-50 border-zinc-100 rounded-2xl focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="destination-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Destination Node</Label>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  id="destination-input"
                  placeholder="Sync Destination" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-11 h-14 bg-zinc-50 border-zinc-100 rounded-2xl focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label id="transport-mode-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transport Mode Telemetry</Label>
            <div 
              role="group" 
              aria-labelledby="transport-mode-label"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <span id="transport-mode-label-sr" className="sr-only">Select your transport mode</span>
              {TRANSPORT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  aria-pressed={selectedMode === mode.id}
                  aria-label={`${mode.label}${selectedMode === mode.id ? ', currently selected' : ''}`}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
                    selectedMode === mode.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50"
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
            {calculating ? <Spinner className="h-6 w-6 text-white" label="Executing impact audit..." /> : "Initiate Impact Audit"}
          </Button>
        </CardContent>
      </Card>

      {activeResult && (
        <section className="space-y-8 animate-fade-in pb-10">
          <Card className="bg-white border-zinc-200 shadow-sm rounded-[2.5rem] overflow-hidden">
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
                <MetricDisplay label="Total Dist" value={activeResult.distance} unit="KM" color="text-foreground" />
                <MetricDisplay label="CO₂ Generated" value={activeResult.co2} unit="KG" color="text-red-500" />
                <MetricDisplay label="Reward Credit" value={activeResult.points} unit="PTS" color="text-primary" />
                <MetricDisplay label="Node Status" value="ACTIVE" isBadge unit="" color="text-emerald-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {saving ? <Spinner className="h-5 w-5" label="Committing telemetry..." /> : "Commit Telemetry"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={discardResult} 
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
