"use client";

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useLocation } from 'wouter';
import { IS_DEMO_KEY } from '@/lib/constants';
import { clearSessionCookieAction } from '@/app/actions/session';

/**
 * Settings Page with session cleanup.
 */
export default function SettingsPage() {
  const auth = useAuth();
  const [, navigate] = useLocation();

  /**
   * Clears session cookie and signs out of Firebase.
   */
  const handleLogout = useCallback(async () => {
    if (!auth) return;
    sessionStorage.removeItem(IS_DEMO_KEY);
    await clearSessionCookieAction();
    await signOut(auth);
    navigate('/login');
  }, [auth, router]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-headline font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and platform preferences.</p>
      </header>

      <div className="grid gap-6">
        <Card className="bg-white border-zinc-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Control how you receive alerts and reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Weekly Summary</Label>
                <p className="text-xs text-muted-foreground">Receive a performance report every Monday.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-black/5" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Challenge Alerts</Label>
                <p className="text-xs text-muted-foreground">Be notified when new sustainability challenges are available.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
            <CardDescription>Manage your data visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Public Profile</Label>
                <p className="text-xs text-muted-foreground">Allow others to see your Green Points and level.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 pt-4">
          <Button variant="ghost" className="w-fit text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout from EcoPulse
          </Button>
          
          <Card className="bg-red-50 border-red-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-headline text-destructive flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground mb-4">Deleting your account is permanent and will remove all your green points and progress.</p>
               <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
