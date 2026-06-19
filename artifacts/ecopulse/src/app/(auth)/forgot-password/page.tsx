import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Leaf, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { APP_METADATA } from "@/lib/constants";

/**
 * Forgot Password page — sends a Firebase password reset email.
 */
export default function ForgotPasswordPage() {
  const { user, isLoading: authLoading } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Redirect authenticated users away from this page
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleReset = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
        return;
      }

      setLoading(true);
      try {
        if (!auth) throw new Error("auth/not-initialized");
        await sendPasswordResetEmail(auth, trimmedEmail);
        setSent(true);
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code ?? "";
        if (code === "auth/user-not-found" || code === "") {
          // Silently succeed for user-not-found to prevent email enumeration,
          // and for the no-code case (success path doesn't always have a code).
          setSent(true);
        } else if (code === "auth/invalid-email") {
          toast({
            variant: "destructive",
            title: "Invalid Email",
            description: "Please double-check the email address.",
          });
        } else if (code === "auth/too-many-requests") {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "Please wait a few minutes before trying again.",
          });
        } else if (code === "auth/not-initialized") {
          toast({
            variant: "destructive",
            title: "Service Unavailable",
            description: "Firebase is not configured. Contact support.",
          });
        } else {
          // Network error or other — show a real message so the user knows to retry
          toast({
            variant: "destructive",
            title: "Send Failed",
            description:
              "Could not send reset email. Check your internet connection and try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [email, toast]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" label="Verifying session..." />
      </div>
    );
  }

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
              Reset Access Key
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-6">
          {sent ? (
            /* ── Success state ── */
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-5 py-4 text-center animate-fade-in"
            >
              <div className="p-4 bg-primary/10 rounded-2xl ring-8 ring-primary/5">
                <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="font-headline font-bold text-lg text-foreground">Check your inbox</p>
                <p className="text-sm text-zinc-600 max-w-xs mx-auto">
                  If an account exists for{" "}
                  <span className="font-bold text-foreground">{email}</span>, a password reset link
                  has been sent. Check your spam folder if you don't see it.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform focus-visible:ring-2 focus-visible:ring-primary"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <p className="text-sm text-zinc-600 font-medium">
                Enter the email linked to your account. We'll send a secure reset link.
              </p>
              <form onSubmit={handleReset} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label
                    htmlFor="reset-email"
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
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-primary"
                      required
                      aria-describedby="reset-email-hint"
                    />
                  </div>
                  <p id="reset-email-hint" className="text-[10px] text-zinc-500">
                    A reset link will be sent to this address.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform focus-visible:ring-2 focus-visible:ring-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner className="h-5 w-5" label="Sending reset link..." />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-xs text-zinc-600 font-bold hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded outline-none"
            aria-label="Return to login page"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
