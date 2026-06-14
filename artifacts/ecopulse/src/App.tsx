import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { FirebaseClientProvider } from "@/firebase";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalNavigation } from "@/components/layout";
import { useUser } from "@/firebase";
import { Leaf } from "lucide-react";
import { Spinner } from "@/components/ui";
import NotFound from "@/pages/not-found";

const DashboardPage = lazy(() => import("@/app/dashboard/page"));
const AIAdvisorPage = lazy(() => import("@/app/ai-advisor/page"));
const CalculatorPage = lazy(() => import("@/app/calculator/page"));
const InsightsPage = lazy(() => import("@/app/insights/page"));
const KnowledgeHubPage = lazy(() => import("@/app/knowledge-hub/page"));
const RecommendationsPage = lazy(() => import("@/app/recommendations/page"));
const ProgressPage = lazy(() => import("@/app/progress/page"));
const ProfilePage = lazy(() => import("@/app/profile/page"));
const SettingsPage = lazy(() => import("@/app/settings/page"));
const LoginPage = lazy(() => import("@/app/(auth)/login/page"));
const RegisterPage = lazy(() => import("@/app/(auth)/register/page"));
const ForgotPasswordPage = lazy(() => import("@/app/(auth)/forgot-password/page"));

const queryClient = new QueryClient();

const ROUTE_TITLES: Record<string, string> = {
  "/": "EcoPulse AI",
  "/login": "Sign In — EcoPulse AI",
  "/register": "Create Account — EcoPulse AI",
  "/forgot-password": "Reset Password — EcoPulse AI",
  "/dashboard": "Dashboard — EcoPulse AI",
  "/ai-advisor": "AI Advisor — EcoPulse AI",
  "/calculator": "Carbon Calculator — EcoPulse AI",
  "/insights": "Insights — EcoPulse AI",
  "/knowledge-hub": "Knowledge Hub — EcoPulse AI",
  "/recommendations": "Recommendations — EcoPulse AI",
  "/progress": "Progress — EcoPulse AI",
  "/profile": "Profile — EcoPulse AI",
  "/settings": "Settings — EcoPulse AI",
};

function PageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[location] ?? "EcoPulse AI";
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl shadow-lg border border-zinc-100">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Initialising Node...</p>
        <Spinner className="h-5 w-5 text-primary" label="Initializing environment node..." />
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user, isLoading } = useUser();

  if (isLoading) return <PageLoader />;

  return <Redirect to={user ? "/dashboard" : "/login"} />;
}

function Router() {
  return (
    <GlobalNavigation>
      <PageTitle />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={RootRedirect} />
          <Route path="/login">
            <LoginPage />
          </Route>
          <Route path="/register">
            <RegisterPage />
          </Route>
          <Route path="/forgot-password">
            <ForgotPasswordPage />
          </Route>
          <Route path="/dashboard">
            <DashboardPage />
          </Route>
          <Route path="/ai-advisor">
            <AIAdvisorPage />
          </Route>
          <Route path="/calculator">
            <CalculatorPage />
          </Route>
          <Route path="/insights">
            <InsightsPage />
          </Route>
          <Route path="/knowledge-hub">
            <KnowledgeHubPage />
          </Route>
          <Route path="/recommendations">
            <RecommendationsPage />
          </Route>
          <Route path="/progress">
            <ProgressPage />
          </Route>
          <Route path="/profile">
            <ProfilePage />
          </Route>
          <Route path="/settings">
            <SettingsPage />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </GlobalNavigation>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FirebaseClientProvider>
          <ErrorBoundary>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </ErrorBoundary>
          <Toaster />
        </FirebaseClientProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
