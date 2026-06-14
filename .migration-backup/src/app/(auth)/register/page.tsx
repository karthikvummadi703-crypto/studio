"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
import { auth, db, useUser } from '@/firebase';
import { doc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Leaf, User as UserIcon, Mail, Lock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { COLLECTIONS, IS_DEMO_KEY } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { setSessionCookieAction } from '@/app/actions/session';
import { FirebaseError } from 'firebase/app';

/**
 * Registration page component for creating new environment nodes.
 */
export default function RegisterPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Auth Guard: Redirect already authenticated users to the dashboard.
   */
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  /**
   * Sets the session cookie via server action.
   */
  const handleSession = useCallback(async (user: User) => {
    const idToken = await user.getIdToken();
    await setSessionCookieAction(idToken);
  }, []);

  /**
   * Validates registration input with enhanced security and XSS protection.
   */
  const validateInput = useCallback((): boolean => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // At least 8 chars, 1 number, 1 uppercase, 1 lowercase
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    // Block script injection in name
    const xssRegex = /<[^>]*>|javascript:/i;
    const newErrors: Record<string, string> = {};

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      newErrors.fullName = 'Name must be between 2 and 100 characters.';
    }
    if (xssRegex.test(trimmedName)) {
      newErrors.fullName = 'Name contains invalid characters.';
    }
    if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!passwordRegex.test(password)) {
      newErrors.password = 'Password must be 8+ characters with uppercase, lowercase and a number.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please check the form for errors.' });
      return false;
    }
    return true;
  }, [fullName, email, password, toast]);

  const handleRegister = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateInput()) return;
    
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userRefData = cred.user;

      await updateProfile(userRefData, { displayName: fullName });

      const batch = writeBatch(db);
      
      const userData = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        greenPoints: 0,
        sustainabilityScore: 0,
        level: 'Seedling',
        createdAt: serverTimestamp(),
        completedChallenges: []
      };

      const userDocRef = doc(db, COLLECTIONS.USERS, userRefData.uid);
      const activityDocRef = doc(collection(db, COLLECTIONS.ACTIVITIES));

      batch.set(userDocRef, userData);
      batch.set(activityDocRef, {
        userId: userRefData.uid,
        type: 'initialization',
        description: 'Profile telemetry initialized',
        pointsEarned: 0,
        timestamp: serverTimestamp()
      });

      await batch.commit().catch((err) => {
        if (err.code === 'permission-denied') {
          const pErr = new FirestorePermissionError({ 
            path: userDocRef.path, 
            operation: 'write', 
            requestResourceData: userData 
          });
          errorEmitter.emit('permission-error', pErr);
          throw pErr;
        }
        throw err;
      });

      sessionStorage.removeItem(IS_DEMO_KEY);
      await handleSession(userRefData);
      
      toast({ title: "Node Registered", description: "Welcome to EcoPulse AI!" });
      router.push('/dashboard');
    } catch (error: unknown) {
      logger.error('[Register] Error:', error);
      const code = error instanceof FirebaseError ? error.code : 'unknown';
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: getAuthErrorMessage(code),
      });
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, validateInput, router, toast, handleSession]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" label="Verifying network status..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-primary/5" aria-hidden="true">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">Join EcoPulse</CardTitle>
            <CardDescription className="text-sm uppercase font-black tracking-widest text-zinc-600">Initialize Environment Node</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input 
                  id="fullName"
                  autoComplete="name"
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  className={cn("h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary", errors.fullName && "border-red-500")}
                  required
                />
              </div>
              {errors.fullName && <p id="fullName-error" className="text-[10px] text-red-600 font-bold uppercase">{errors.fullName}</p>}
            </div>

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
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn("h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary", errors.email && "border-red-500")}
                  required
                />
              </div>
              {errors.email && <p id="email-error" className="text-[10px] text-red-600 font-bold uppercase">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="Security Key" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <Input 
                  id="password"
                  type="password" 
                  autoComplete="new-password"
                  placeholder="Min 8 chars, 1 number" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={cn("h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary", errors.password && "border-red-500")}
                  required
                />
              </div>
              {errors.password && <p id="password-error" className="text-[10px] text-red-600 font-bold uppercase">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform focus-visible:ring-2 focus-visible:ring-primary"
              disabled={loading}
            >
              {loading ? <Spinner className="h-5 w-5" label="Registering environment node..." /> : "Register Node"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
          <p className="text-xs text-zinc-600 font-medium">
            Already registered? <Link href="/login" className="text-primary font-bold hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
