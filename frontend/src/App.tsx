
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react"; // Updated to use Clerk's useAuth
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUpPage";
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
const AuthDebug = memo(({ user }: { user: any }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  // Note: The 'user' prop for AuthDebug would need to be passed from Clerk's useUser() or useAuth()
  // if this component were to be actively used. For now, it's not instantiated in ProtectedRoute.
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
});
AuthDebug.displayName = 'AuthDebug';

// Using memo to prevent unnecessary re-renders
const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, userId } = useAuth(); // Use Clerk's useAuth

  useEffect(() => {
    if (isLoaded) {
      console.log("[CLERK ROUTER] ProtectedRoute check:", { isLoaded, isSignedIn, userId });
    }
  }, [isLoaded, isSignedIn, userId]);

  if (!isLoaded) {
    console.log("[CLERK ROUTER] Auth is loading...");
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    console.log("[CLERK ROUTER] User not signed in, redirecting to /login");
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // At this point, user is signed in.
  // We can add profile completion logic here later if needed, using Clerk's user object.
  // For now, if signed in, grant access.
  console.log("[CLERK ROUTER] User signed in, rendering protected content for userId:", userId);
  
  // The AuthDebug component might need to be updated to use Clerk's user object if still needed
  // const authDebug = process.env.NODE_ENV === 'development' ? <AuthDebug user={/* Clerk's user object */} /> : null;

  return (
    <>
      {/* authDebug */}
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
      <Route path="/login/*" element={<Login />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
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
            <DataSeed />
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
            <InstantPost />
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
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
