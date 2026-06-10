"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Leaf, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { COLLECTIONS } from '@/lib/constants';

/**
 * Registration page component for creating new environment nodes.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles user registration and profile initialization.
   */
  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    
    logger.log('[Register] Starting registration for:', email);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, { displayName: fullName });

      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        fullName,
        email,
        greenPoints: 0,
        sustainabilityScore: 0,
        level: 'Seedling',
        createdAt: new Date().toISOString(),
        completedChallenges: []
      });

      await addDoc(collection(db, COLLECTIONS.ACTIVITIES), {
        userId: user.uid,
        type: 'initialization',
        description: 'Profile telemetry initialized',
        pointsEarned: 0,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Node Registered",
        description: "Welcome to EcoPulse AI! Redirecting to dashboard...",
      });

      router.push('/dashboard');
    } catch (error: any) {
      logger.error('[Register] Critical Error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred during initialization.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">Join EcoPulse</CardTitle>
            <CardDescription className="text-sm uppercase font-bold tracking-widest text-zinc-400">Initialize Environment Node</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                <Input 
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-12 bg-zinc-50 border-zinc-100 rounded-xl focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

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
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register Node"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
          <p className="text-xs text-zinc-500">
            Already registered? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
