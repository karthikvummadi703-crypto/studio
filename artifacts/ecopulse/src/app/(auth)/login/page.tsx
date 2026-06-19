
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithCredential,
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
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, APP_METADATA, DEMO_USER, IS_DEMO_KEY } from '@/lib/constants';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { setSessionCookieAction } from '@/app/actions/session';
import { LEVEL_CONFIG } from '@/lib/levels';
import { FirebaseError } from 'firebase/app';
import { fetchGoogleClientId, loadGsiScript, renderGoogleButton } from '@/lib/google-gis';

/** Google wordmark SVG so we can show a consistent icon on all states */
const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/**
 * Login page with email/password, Google OAuth, and Demo Mode.
 *
 * Google sign-in strategy (in order of preference):
 *   1. Google Identity Services (GIS) + signInWithCredential — bypasses
 *      Firebase's client-side authorized-domain check entirely.
 *   2. signInWithPopup — classic Firebase popup, used as fallback when the
 *      Firebase project's init.json doesn't expose a clientId (e.g. no
 *      Firebase Hosting), or when GIS fails to load.
 *
 * Either way there is NO setup code pasted into Firebase Console on every
 * visit.  The deployed .replit.app domain only needs to be added to
 * Firebase Console → Authentication → Authorized Domains ONCE (and only if
 * using the popup fallback path).
 */
export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  /* ── GIS rendering ──
     gsiReady = true  → GIS button rendered in gsiContainerRef; overlay hidden
     gsiReady = false → overlay button shows; clicks use popup fallback
  */
  const gsiContainerRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const gsiClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initGsi() {
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
      if (!authDomain) return;

      const clientId = await fetchGoogleClientId(authDomain);
      if (!clientId || cancelled) return;
      gsiClientIdRef.current = clientId;

      try {
        await loadGsiScript();
        if (cancelled || !gsiContainerRef.current) return;
        await renderGoogleButton(gsiContainerRef.current, clientId);
        if (!cancelled) setGsiReady(true);
      } catch {
        /* GIS failed — overlay button will use popup fallback automatically */
      }
    }

    initGsi();
    return () => { cancelled = true; };
  }, []);

  /* ── Shared: write Firestore profile + navigate ── */
  const handleSession = useCallback(async (user: User) => {
    const idToken = await user.getIdToken();
    await setSessionCookieAction(idToken);
  }, []);

  const saveGoogleProfile = useCallback(async (user: User) => {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.USERS, user.uid), {
      fullName: user.displayName || 'Eco Warrior',
      email: user.email || '',
      greenPoints: 0,
      sustainabilityScore: 0,
      level: 'Seedling',
      createdAt: serverTimestamp(),
      completedChallenges: [],
    }, { merge: true });

    batch.set(doc(collection(db, COLLECTIONS.ACTIVITIES)), {
      userId: user.uid,
      type: 'milestone',
      description: 'Joined EcoPulse via Google Login',
      pointsEarned: 0,
      timestamp: serverTimestamp(),
    });

    await batch.commit();
  }, []);

  /* ── Google Sign-In ──
     Tries GIS (no domain restriction) first; falls back to signInWithPopup.
  */
  const handleGoogleLogin = useCallback(async (): Promise<void> => {
    setGoogleLoading(true);
    try {
      const clientId = gsiClientIdRef.current;

      if (clientId && gsiReady && window.google?.accounts?.id) {
        /* Path A: GIS — no Firebase authorized-domain check */
        const idToken = await renderGoogleButton(gsiContainerRef.current!, clientId);
        const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        await saveGoogleProfile(result.user);
        sessionStorage.removeItem(IS_DEMO_KEY);
        await handleSession(result.user);
        navigate('/dashboard');
      } else {
        /* Path B: Popup fallback */
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await saveGoogleProfile(result.user);
        sessionStorage.removeItem(IS_DEMO_KEY);
        await handleSession(result.user);
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const code = error instanceof FirebaseError ? error.code : 'unknown';
      /* Ignore user-cancelled clicks */
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: code !== 'unknown'
          ? getAuthErrorMessage(code)
          : 'Could not sign in with Google. Please try again or use email/password.',
      });
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate, toast, handleSession, saveGoogleProfile, gsiReady]);

  const handleLogin = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.removeItem(IS_DEMO_KEY);
      await handleSession(userCredential.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      const code = error instanceof FirebaseError ? error.code : 'unknown';
      toast({ variant: 'destructive', title: 'Login Failed', description: getAuthErrorMessage(code) });
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate, toast, handleSession]);

  const handleDemoMode = useCallback(async (): Promise<void> => {
    setDemoLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const user = cred.user;

      const batch = writeBatch(db);
      batch.set(doc(db, COLLECTIONS.USERS, user.uid), {
        fullName: DEMO_USER.FULL_NAME,
        greenPoints: DEMO_USER.GREEN_POINTS,
        sustainabilityScore: DEMO_USER.SUSTAINABILITY_SCORE,
        level: LEVEL_CONFIG[DEMO_USER.LEVEL as keyof typeof LEVEL_CONFIG]
          ? DEMO_USER.LEVEL : 'Seedling',
        createdAt: serverTimestamp(),
        completedChallenges: [...DEMO_USER.COMPLETED_CHALLENGES],
      }, { merge: true });

      batch.set(doc(collection(db, COLLECTIONS.ACTIVITIES)), {
        userId: user.uid, type: 'milestone',
        description: 'Joined EcoPulse via Demo Mode',
        pointsEarned: 0, timestamp: serverTimestamp(),
      });

      await batch.commit();
      sessionStorage.setItem(IS_DEMO_KEY, 'true');
      await handleSession(user);
      navigate('/dashboard');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Demo Access Failed',
        description: 'Anonymous sign-in may be disabled. Enable it in Firebase Console → Authentication → Sign-in method → Anonymous.',
      });
    } finally {
      setDemoLoading(false);
    }
  }, [navigate, toast, handleSession]);

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
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input
                  id="email" type="email" autoComplete="email"
                  placeholder="name@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input
                  id="password" type="password" autoComplete="current-password"
                  placeholder="••••••••" value={password}
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
            {/*
              Google button: GIS renders its own button when the clientId is
              available (no Firebase domain restriction). Otherwise the overlay
              button handles the click via signInWithPopup.
            */}
            <div className="relative h-12">
              {/* GIS injects its own button DOM here */}
              <div
                ref={gsiContainerRef}
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
                style={{ visibility: gsiReady ? 'visible' : 'hidden' }}
                aria-hidden={!gsiReady}
              />

              {/* Overlay: shown while GIS loads, or permanently if GIS unavailable */}
              {(!gsiReady || googleLoading) && (
                <Button
                  variant="outline"
                  className="absolute inset-0 w-full h-full border-zinc-300 text-zinc-800 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={handleGoogleLogin}
                  disabled={anyLoading}
                  aria-label="Sign in with Google"
                  type="button"
                >
                  {googleLoading
                    ? <Spinner className="h-4 w-4" label="Connecting Google..." />
                    : <><GoogleIcon /> Google</>}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              className="h-12 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-bold rounded-xl flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={handleDemoMode}
              disabled={anyLoading}
              aria-label="Explore the app in Demo Mode"
              type="button"
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
