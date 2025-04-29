
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState, memo } from "react";
import ProfileComplete from "./pages/ProfileComplete";

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

// Using memo to prevent unnecessary re-renders
const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loading screen while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("[ROUTER] User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If user profile isn't complete and route isn't the profile completion page,
  // redirect to profile completion
  if (user && user.profileComplete === false && window.location.pathname !== '/profile-complete') {
    console.log("[ROUTER] User profile incomplete, redirecting to profile completion");
    return <Navigate to="/profile-complete" replace />;
  }
  
  // User is authenticated, render the protected content
  return <AppLayout>{children}</AppLayout>;
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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
