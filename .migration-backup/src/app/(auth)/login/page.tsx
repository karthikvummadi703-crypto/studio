"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';
import { Leaf, Mail, Lock, Sparkles, FlaskConical } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, APP_METADATA, DEMO_USER, IS_DEMO_KEY } from '@/lib/constants';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { setSessionCookieAction } from '@/app/actions/session';
import { LEVEL_CONFIG } from '@/lib/levels';
import { FirebaseError } from 'firebase/app';

/**
 * Login page with email/password, Google OAuth, Forgot Password link, and Demo Mode.
 */
export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSession = useCallback(async (user: User) => {
    const idToken = await user.getIdToken();
    await setSessionCookieAction(idToken);
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.removeItem(IS_DEMO_KEY);
      await handleSession(userCredential.user);
      router.push('/dashboard');
    } catch (error: unknown) {
      const code = error instanceof FirebaseError ? error.code : 'unknown';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: getAuthErrorMessage(code),
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, router, toast, handleSession]);

  const handleGoogleLogin = useCallback(async (): Promise<void> => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const batch = writeBatch(db);
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));

      batch.set(userRef, {
        fullName: user.displayName || 'Eco Warrior',
        email: user.email || '',
        greenPoints: 0,
        sustainabilityScore: 0,
        level: 'Seedling',
        createdAt: serverTimestamp(),
        completedChallenges: [],
      }, { merge: true });

      batch.set(activityRef, {
        userId: user.uid,
        type: 'milestone',
        description: 'Joined EcoPulse via Google Login',
        pointsEarned: 0,
        timestamp: serverTimestamp(),
      });

      await batch.commit();

      sessionStorage.removeItem(IS_DEMO_KEY);
      await handleSession(user);
      router.push('/dashboard');
    } catch (error: unknown) {
      const code = error instanceof FirebaseError ? error.code : 'unknown';
      toast({
        variant: 'destructive',
        title: 'Google Login Failed',
        description: getAuthErrorMessage(code),
      });
    } finally {
      setGoogleLoading(false);
    }
  }, [router, toast, handleSession]);

  const handleDemoMode = useCallback(async (): Promise<void> => {
    setDemoLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const user = cred.user;

      const batch = writeBatch(db);
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));

      batch.set(userRef, {
        fullName: DEMO_USER.FULL_NAME,
        greenPoints: DEMO_USER.GREEN_POINTS,
        sustainabilityScore: DEMO_USER.SUSTAINABILITY_SCORE,
        level: LEVEL_CONFIG[DEMO_USER.LEVEL as keyof typeof LEVEL_CONFIG] ? DEMO_USER.LEVEL : 'Seedling',
        createdAt: serverTimestamp(),
        completedChallenges: [...DEMO_USER.COMPLETED_CHALLENGES],
      }, { merge: true });

      batch.set(activityRef, {
        userId: user.uid,
        type: 'milestone',
        description: 'Joined EcoPulse via Demo Mode',
        pointsEarned: 0,
        timestamp: serverTimestamp(),
      });

      await batch.commit();

      sessionStorage.setItem(IS_DEMO_KEY, 'true');
      await handleSession(user);
      router.push('/dashboard');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Demo Access Failed',
        description:
          'Anonymous sign-in may be disabled. Enable it in Firebase Console → Authentication → Sign-in method → Anonymous.',
      });
    } finally {
      setDemoLoading(false);
    }
  }, [router, toast, handleSession]);

  const anyLoading = loading || googleLoading || demoLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 text-center space-y-4">
          <div
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-primary/5"
            aria-hidden="true"
          >
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">
              {APP_METADATA.NAME}
            </CardTitle>
            <CardDescription className="text-sm uppercase font-black tracking-widest text-zinc-600">
              {APP_METADATA.TAGLINE}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">

          {/* Demo mode info banner */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <FlaskConical className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Demo Mode Available</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Explore all features with pre-filled data. No account required.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-primary hover:underline underline-offset-2 focus-visible:ring-1 focus-visible:ring-primary rounded outline-none"
                  aria-label="Forgot your password? Reset it here"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform focus-visible:ring-2 focus-visible:ring-primary"
              disabled={anyLoading}
            >
              {loading ? <Spinner className="h-5 w-5" label="Signing in..." /> : 'Sign In'}
            </Button>
          </form>

          <div className="relative py-2" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
              <span className="bg-white px-2 text-zinc-600">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-zinc-300 text-zinc-800 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={handleGoogleLogin}
              disabled={anyLoading}
              aria-label="Sign in with Google"
            >
              {googleLoading
                ? <Spinner className="h-4 w-4" label="Connecting Google..." />
                : 'Google'}
            </Button>
            <Button
              variant="outline"
              className="h-12 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={handleDemoMode}
              disabled={anyLoading}
              aria-label="Explore the app in Demo Mode"
            >
              {demoLoading
                ? <Spinner className="h-4 w-4" label="Entering demo mode..." />
                : <><Sparkles className="h-4 w-4" /> Demo</>}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="p-10 pt-0 text-center">
          <p className="text-xs text-zinc-600 font-medium w-full">
            New to the network?{' '}
            <Link
              href="/register"
              className="text-primary font-bold hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              Register Node
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
