
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DataSeed from "./pages/DataSeed";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PublishedContent from "./pages/PublishedContent";
import Subscription from "./pages/Subscription";
import InstantPost from "./pages/InstantPost";
import AppLayout from "./components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { useEffect, useState, memo } from "react";
import ProfileComplete from "./pages/ProfileComplete";
import { ThemeProvider } from "./components/ThemeProvider";
import SubscriptionProtectedRoute from "./components/routes/SubscriptionProtectedRoute";

// Create QueryClient outside of component to ensure it's only created once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Memoize loading component to prevent re-renders
const LoadingScreen = memo(() => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading authentication...</p>
    </div>
  </div>
));
LoadingScreen.displayName = 'LoadingScreen';

// Auth Debug Component - only shown in development
const AuthDebug = ({ user }: { user: any }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-2 text-xs max-w-[300px] z-50 rounded-tl-md">
      <div>Auth Status: {user ? 'Logged In' : 'Logged Out'}</div>
      <div>Profile: {user?.profileComplete ? 'Complete' : 'Incomplete'}</div>
      <div>Name: {user?.name || 'N/A'}</div>
      <div>LS-Skip: {localStorage.getItem('profile_skip_attempted') || 'false'}</div>
      <div>LS-Complete: {localStorage.getItem('profile_completed') || 'false'}</div>
      <div>LS-Bypass: {localStorage.getItem('profile_bypass_attempts') || 'null'}</div>
    </div>
  );
};

// Using memo to prevent unnecessary re-renders
const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [shouldBypassProfileCheck, setShouldBypassProfileCheck] = useState(false);
  
  // Enhanced logging for protected route decisions
  useEffect(() => {
    console.log("[ROUTER] Protected route accessed, auth status:", 
      isAuthenticated ? "Authenticated" : "Not authenticated", 
      "Loading:", isLoading,
      "User:", user?.email || "No email",
      "Profile complete flag:", user?.profileComplete ? "Complete" : "Incomplete"
    );
    
    // Log localStorage state for debugging
    console.log("[ROUTER] LocalStorage state:", {
      profile_skip_attempted: localStorage.getItem('profile_skip_attempted'),
      profile_completed: localStorage.getItem('profile_completed'),
      profile_bypass_attempts: localStorage.getItem('profile_bypass_attempts'),
      auth_active: localStorage.getItem('auth_active')
    });
  }, [isAuthenticated, isLoading, user]);
  
  // Check for profile bypass flags with enhanced recovery
  useEffect(() => {
    // Reset bypass attempts if coming from profile complete page
    if (window.location.pathname === '/profile-complete') {
      localStorage.removeItem('profile_bypass_attempts');
    }
    
    // Check multiple sources to determine if we should bypass profile completion
    const hasSkippedProfileCompletion = localStorage.getItem('profile_skip_attempted') === 'true';
    const hasCompletedProfile = localStorage.getItem('profile_completed') === 'true';
    const databaseProfileComplete = user?.profileComplete === true;
    
    // Force bypass after multiple attempts to prevent endless loops
    // But make sure to increment cautiously
    const bypassAttemptCount = parseInt(localStorage.getItem('profile_bypass_attempts') || '0', 10);
    
    // Check if we need to force a bypass to prevent infinite loops
    if (bypassAttemptCount >= 3) {
      console.warn("[ROUTER] Forcing profile bypass after multiple attempts");
      localStorage.setItem('profile_skip_attempted', 'true');
      localStorage.setItem('profile_completed', 'true');
      setShouldBypassProfileCheck(true);
      return;
    }
    
    // If any of these conditions are met, bypass profile check
    if (hasSkippedProfileCompletion || hasCompletedProfile || databaseProfileComplete) {
      console.log("[ROUTER] Bypassing profile check due to:", {
        hasSkippedProfileCompletion,
        hasCompletedProfile,
        databaseProfileComplete
      });
      setShouldBypassProfileCheck(true);
    } else if (window.location.pathname !== '/profile-complete') {
      // Only increment bypass attempt counter when not on profile completion page
      // and when we're actually going to try to redirect to profile completion
      localStorage.setItem('profile_bypass_attempts', String(bypassAttemptCount + 1));
    }
  }, [user, window.location.pathname]);
  
  // Show loading screen while checking auth
  if (isLoading) {
    console.log("[ROUTER] Auth is still loading");
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("[ROUTER] User not authenticated, redirecting to login");
    // Clear any bypass attempts on redirect to login
    localStorage.removeItem('profile_bypass_attempts');
    return <Navigate to="/login" replace />;
  }
  
  // Add debug component in development mode
  const authDebug = process.env.NODE_ENV === 'development' ? <AuthDebug user={user} /> : null;
  
  // If user profile isn't complete and route isn't the profile completion page,
  // and we haven't set the bypass flag, redirect to profile completion
  if (user && 
      user.profileComplete === false && 
      window.location.pathname !== '/profile-complete' && 
      !shouldBypassProfileCheck) {
    console.log("[ROUTER] User profile incomplete, redirecting to profile completion");
    return (
      <>
        {authDebug}
        <Navigate to="/profile-complete" replace />
      </>
    );
  }
  
  // User is authenticated, render the protected content
  console.log("[ROUTER] User authenticated, rendering protected content");
  return (
    <>
      {authDebug}
      <AppLayout>{children}</AppLayout>
    </>
  );
});
ProtectedRoute.displayName = 'ProtectedRoute';

// Memoize routes to prevent unnecessary re-renders
const AppRoutes = memo(() => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile-complete" element={
        <ProfileComplete />
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/data-seed" element={
        <ProtectedRoute>
          <SubscriptionProtectedRoute featureName="Data Seed">
            <DataSeed />
          </SubscriptionProtectedRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/schedule" element={
        <ProtectedRoute>
          <Schedule />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/published" element={
        <ProtectedRoute>
          <PublishedContent />
        </ProtectedRoute>
      } />
      
      <Route path="/subscription" element={
        <ProtectedRoute>
          <Subscription />
        </ProtectedRoute>
      } />
      
      <Route path="/instant-post" element={
        <ProtectedRoute>
          <SubscriptionProtectedRoute featureName="Instant Post">
            <InstantPost />
          </SubscriptionProtectedRoute>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
});
AppRoutes.displayName = 'AppRoutes';

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="writlix-theme">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
