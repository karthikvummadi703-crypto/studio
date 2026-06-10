"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Leaf, Sparkles, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, APP_METADATA } from '@/lib/constants';

/**
 * Secure Login Page with Middleware Session Synchronization.
 */
export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * Sets the session cookie for middleware authentication.
   */
  const setSessionCookie = useCallback(async (user: any) => {
    const idToken = await user.getIdToken();
    document.cookie = `__session=${idToken}; path=/; secure; samesite=strict; max-age=3600`;
  }, []);

  /**
   * Handles standard email/password authentication.
   */
  const handleLogin = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await setSessionCookie(userCredential.user);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, router, toast, setSessionCookie]);

  /**
   * Handles Google OAuth login with session synchronization.
   */
  const handleGoogleLogin = useCallback(async (): Promise<void> => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(userRef, {
        fullName: user.displayName || 'Eco Warrior',
        email: user.email || '',
        greenPoints: 0,
        sustainabilityScore: 0,
        level: 'Seedling',
        createdAt: serverTimestamp(),
        completedChallenges: []
      }, { merge: true });
      
      await setSessionCookie(user);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message,
      });
    } finally {
      setGoogleLoading(false);
    }
  }, [router, toast, setSessionCookie]);

  /**
   * Initializes anonymous session for the Demo Mode.
   */
  const handleDemoMode = useCallback(async (): Promise<void> => {
    setDemoLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const user = cred.user;

      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(userRef, {
        fullName: 'Eco Explorer (Demo)',
        greenPoints: 320,
        sustainabilityScore: 68,
        level: 'Eco Warrior',
        createdAt: serverTimestamp(),
        completedChallenges: ['challenge-1']
      }, { merge: true });

      await addDoc(collection(db, COLLECTIONS.ACTIVITIES), {
        userId: user.uid,
        type: 'milestone',
        description: 'Joined the EcoPulse network via Demo Mode',
        pointsEarned: 50,
        timestamp: serverTimestamp()
      });

      await setSessionCookie(user);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Demo Access Failed",
        description: "Anonymous Auth may be disabled.",
      });
    } finally {
      setDemoLoading(false);
    }
  }, [router, toast, setSessionCookie]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-primary/5" aria-hidden="true">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">{APP_METADATA.NAME}</CardTitle>
            <CardDescription className="text-sm uppercase font-black tracking-widest text-zinc-600">{APP_METADATA.TAGLINE}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input 
                  id="email"
                  type="email" 
                  autoComplete="email"
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input 
                  id="password"
                  type="password" 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform focus-visible:ring-2 focus-visible:ring-primary"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="relative py-2" aria-hidden="true">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]"><span className="bg-white px-2 text-zinc-600">Or</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12 border-zinc-300 text-zinc-800 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              aria-label="Sign in with Google"
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Google</>}
            </Button>
            <Button 
              variant="outline" 
              className="h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={handleDemoMode}
              disabled={demoLoading}
              aria-label="Explore as Demo User"
            >
              {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Demo</>}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
          <p className="text-xs text-zinc-600 font-medium">
            New to the network? <Link href="/register" className="text-primary font-bold hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded">Register Node</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
