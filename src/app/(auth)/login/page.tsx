
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Leaf, Sparkles, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const user = cred.user;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Seed Demo Profile
        await setDoc(userRef, {
          fullName: 'Eco Explorer (Demo)',
          email: 'demo@ecopulse.ai',
          greenPoints: 320,
          sustainabilityScore: 68,
          level: 'Eco Warrior',
          createdAt: new Date().toISOString(),
          completedChallenges: ['challenge-1']
        });

        // Seed some Demo Activity
        await addDoc(collection(db, 'activities'), {
          userId: user.uid,
          type: 'milestone',
          description: 'Joined the EcoPulse network',
          pointsEarned: 50,
          timestamp: new Date().toISOString()
        });

        // Seed a Sample Calculation
        await addDoc(collection(db, 'calculator_records'), {
          userId: user.uid,
          start: 'Central Park',
          destination: 'Times Square',
          mode: 'metro',
          distance: 4.2,
          co2: 0.08,
          impact: 'Low',
          points: 12,
          timestamp: new Date().toISOString()
        });
      }

      toast({
        title: "Demo Mode Active",
        description: "Explore EcoPulse with pre-populated telemetry.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Demo Access Failed",
        description: error.message,
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background">
      <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">EcoPulse AI</CardTitle>
            <CardDescription className="text-sm uppercase font-bold tracking-widest text-zinc-400">Environmental Strategy Node</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-100 rounded-xl focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-100 rounded-xl focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-white px-2 text-zinc-400">Or</span></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl flex items-center justify-center gap-2"
            onClick={handleDemoMode}
            disabled={demoLoading}
          >
            {demoLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Enter Demo Mode</>}
          </Button>
        </CardContent>

        <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
          <p className="text-xs text-zinc-500">
            New to the network? <Link href="/register" className="text-primary font-bold hover:underline">Register Node</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
