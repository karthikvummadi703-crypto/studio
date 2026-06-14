
"use client";

import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  CheckCircle2, 
  Settings as SettingsIcon,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useUser, useDoc, useFirestore, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLevelFromPoints } from '@/lib/levels';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { COLLECTIONS, IS_DEMO_KEY } from '@/lib/constants';
import type { UserProfile } from '@/types';
import { clearSessionCookieAction } from '@/app/actions/session';

/**
 * Enhanced User Profile Page with strict session cleanup.
 */
export default function ProfilePage() {
  const { user, isLoading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const profileRef = useMemo(() => (user && db ? doc(db, COLLECTIONS.USERS, user.uid) : null), [user, db]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef as any);

  const [activeTab, setActiveTab] = useState('overview');

  /**
   * Clears session cookie and signs out of Firebase.
   */
  const handleLogout = useCallback(async () => {
    if (!auth) return;
    sessionStorage.removeItem(IS_DEMO_KEY);
    await clearSessionCookieAction();
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const level = useMemo(() => getLevelFromPoints(profile?.greenPoints || 0), [profile?.greenPoints]);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return "---";
    try {
      const date = (profile.createdAt as any)?.toDate ? (profile.createdAt as any).toDate() : new Date(profile.createdAt as string);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return "---";
    }
  }, [profile?.createdAt]);

  const loading = authLoading || profileLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-10 w-10 text-primary" label="Syncing environmental node profile..." />
        <p className="text-primary font-bold uppercase tracking-widest text-[10px]">Syncing Environmental Node...</p>
      </div>
    </div>
  );

  if (!profile && !loading) {
     return (
       <div className="max-w-xl mx-auto py-20 text-center space-y-6">
         <h2 className="text-2xl font-headline font-bold">Profile Not Found</h2>
         <p className="text-zinc-500">Your environmental telemetry record could not be located. Please try re-authenticating.</p>
         <Button onClick={handleLogout} variant="outline" className="rounded-xl px-10">Logout</Button>
       </div>
     )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">User Account</h1>
        <p className="text-zinc-600 text-sm">Manage your environmental profile and platform preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'settings', label: 'Preferences', icon: SettingsIcon },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-primary",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-zinc-500 hover:bg-primary/5 hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </div>
              <ChevronRight className={cn("h-4 w-4 transition-transform", activeTab === tab.id ? "rotate-90" : "")} />
            </button>
          ))}
          
          <Separator className="my-6 bg-black/5" />
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-5 py-6 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-2xl text-[11px] font-bold uppercase tracking-widest"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'overview' && profile && (
            <Card className="bg-white border-zinc-100 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-black/5 p-10">
                <div className="flex items-center gap-8">
                   <div className="h-24 w-24 rounded-[2rem] bg-primary flex items-center justify-center text-white font-headline text-4xl font-bold shadow-2xl ring-8 ring-primary/10">
                     {profile.fullName?.[0] || 'E'}
                   </div>
                   <div className="space-y-2">
                      <CardTitle className="font-headline text-3xl text-foreground">{profile.fullName || 'Eco Warrior'}</CardTitle>
                      <div className="flex gap-4">
                        <p className="text-zinc-600 text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" /> {profile.email}
                        </p>
                        <p className="text-zinc-600 text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" /> Joined {joinedDate}
                        </p>
                      </div>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Sustainability Score</p>
                    <p className="text-4xl font-headline font-bold text-primary">{profile.sustainabilityScore || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Green Points</p>
                    <p className="text-4xl font-headline font-bold text-emerald-600">{profile.greenPoints || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Current Status</p>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-4 py-1 uppercase text-[10px] tracking-widest">
                      {level}
                    </Badge>
                  </div>
                </div>
                
                <Separator className="bg-black/5" />
                
                <div className="space-y-6">
                   <h3 className="font-headline font-bold text-xl flex items-center gap-3 text-foreground">
                     <Trophy className="h-5 w-5 text-primary" />
                     Milestones Achieved
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {profile.completedChallenges && profile.completedChallenges.length > 0 ? (
                       profile.completedChallenges.map((id: string) => (
                         <div key={id} className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm">
                           <div className="p-2.5 bg-primary/10 rounded-xl">
                             <CheckCircle2 className="h-5 w-5 text-primary" />
                           </div>
                           <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                             {id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                           </span>
                         </div>
                       ))
                     ) : (
                       <div className="col-span-full p-8 rounded-[2rem] bg-zinc-50 border border-dashed border-zinc-200 text-center">
                         <p className="text-sm text-zinc-500 italic">Complete challenges on the dashboard to earn badges.</p>
                       </div>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="bg-white border-zinc-100 rounded-[2.5rem] p-10">
              <CardHeader className="px-0 pt-0 pb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-2xl">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold text-foreground">Preferences</CardTitle>
                    <CardDescription className="text-zinc-500">Configure how you interact with EcoPulse.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 space-y-10">
                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">Impact Summary</Label>
                    <p className="text-xs text-zinc-500">Receive a performance report every Monday morning.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">Challenge Alerts</Label>
                    <p className="text-xs text-zinc-500">Notification when new sustainability tasks are ready.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-red-100 bg-red-50/30 rounded-[2.5rem] p-10">
              <CardHeader className="px-0 pt-0 pb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-200">
                    <ShieldAlert className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold text-red-600">Danger Zone</CardTitle>
                    <CardDescription className="text-red-500">Irreversible actions related to your account.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                 <div className="p-8 rounded-2xl bg-white border border-red-100 space-y-4">
                    <h4 className="font-bold text-foreground">Terminate Account</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Deleting your account will permanently remove all green points, challenge progress, and historical carbon telemetry.
                    </p>
                    <Button variant="destructive" className="rounded-xl font-bold h-12 px-8">
                      Permanently Delete Account
                    </Button>
                 </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
