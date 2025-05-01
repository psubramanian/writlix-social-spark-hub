import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { restoreAuthLocalFlags } from '../contexts/auth/utils';

const Login = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check for URL errors on mount (once)
  useEffect(() => {
    console.log("[LOGIN] Checking URL for error parameters");
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    if (error) {
      const errorMsg = errorDescription || "There was an error during authentication";
      console.error("[LOGIN] Auth error from URL:", error, errorDescription);
      setErrorMessage(errorMsg);
      
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Try to restore localStorage flags that might have been lost during redirect
    restoreAuthLocalFlags();
    
    // Always reset the bypass attempts counter on login page load
    localStorage.removeItem('profile_bypass_attempts');
  }, []); // Empty deps to run once
  
  // Check authentication status
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log("[LOGIN] User is authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle login with selected provider
  const handleLogin = async (providerName: 'google' | 'linkedin_oidc') => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      setProvider(providerName);
      console.log(`[LOGIN] Attempting to login with ${providerName}...`);
      
      // Before initiating login, make sure to reset any stale profile bypass attempts
      localStorage.removeItem('profile_bypass_attempts');
      
      await login(providerName);
    } catch (error: any) {
      console.error('[LOGIN] Login error:', error);
      setErrorMessage(error.message || "There was an error logging in. Please try again.");
      toast({
        title: "Login Failed",
        description: error.message || "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProvider(null);
    }
  };
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-writlix-lightblue bg-opacity-30">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-writlix-lightblue bg-opacity-30">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="bg-writlix-blue rounded-md p-1">
              <span className="font-bold text-white text-2xl">W</span>
            </div>
            <h1 className="text-3xl font-bold">Writlix</h1>
          </div>
          <p className="mt-2 text-muted-foreground">Your LinkedIn content creator and scheduler</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Writlix</CardTitle>
            <CardDescription>
              Login to manage your LinkedIn content creation and scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              className="w-full bg-[#4285F4] hover:bg-[#4285F4]/90 text-white"
              onClick={() => handleLogin('google')}
              disabled={isLoading}
            >
              {isLoading && provider === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>
            
            <Button 
              className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
              onClick={() => handleLogin('linkedin_oidc')}
              disabled={isLoading}
            >
              {isLoading && provider === 'linkedin_oidc' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                </svg>
              )}
              Continue with LinkedIn
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to Writlix's Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble logging in? <a href="mailto:support@writlix.com" className="text-writlix-blue hover:underline">Contact Support</a>
          </p>
        </div>
        
        {/* Show debug panel in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-black/80 text-xs text-white rounded">
            <p>Debug Tools:</p>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                toast({ title: "Storage Cleared", description: "All localStorage and sessionStorage data has been cleared." });
              }}
              className="text-red-400 underline"
            >
              Clear All Storage
            </button>
            <div className="mt-2">
              <strong>localStorage:</strong>
              <div>profile_completed: {localStorage.getItem('profile_completed') || 'null'}</div>
              <div>profile_skip_attempted: {localStorage.getItem('profile_skip_attempted') || 'null'}</div>
              <div>profile_bypass_attempts: {localStorage.getItem('profile_bypass_attempts') || 'null'}</div>
              <div>auth_active: {localStorage.getItem('auth_active') || 'null'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
