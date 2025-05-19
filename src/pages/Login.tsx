
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { restoreAuthLocalFlags, saveAuthLocalFlagsToSession, performAuthReset } from '@/utils/auth/storageUtils';
import { checkAndRecoverSession } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Import our components
import { LoginForm, LoginFormValues } from '@/components/auth/LoginForm';
import { SignupForm, SignupFormValues } from '@/components/auth/SignupForm';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { LoginPageHeader } from '@/components/auth/LoginPageHeader';
import { DebugPanel } from '@/components/auth/DebugPanel';

const Login = () => {
  const { login, signUp, loginWithPassword, isAuthenticated, isLoading: authLoading, getAuthDebugInfo } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Check for URL errors and attempt session recovery on mount
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[LOGIN ${timestamp}] Component mounted`);
    
    // First check for URL errors
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // Check for error from OAuth provider
    if (error) {
      const errorMsg = errorDescription || "There was an error during authentication";
      console.error(`[LOGIN ${timestamp}] Auth error from URL:`, error, errorDescription);
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
    
    // Attempt session recovery
    if (!recoveryAttempted) {
      setRecoveryAttempted(true);
      
      console.log(`[LOGIN ${timestamp}] Attempting session recovery`);
      
      // Check for broken auth state
      const hasAuthFlag = localStorage.getItem('auth_active') === 'true';
      const authTimestamp = localStorage.getItem('auth_timestamp');
      const authEmail = localStorage.getItem('auth_email');
      
      // If we have auth flags but not authenticated, try to recover session
      if (hasAuthFlag && !isAuthenticated && !authLoading) {
        console.log(`[LOGIN ${timestamp}] Possible broken session detected, attempting recovery`);
        console.log(`[LOGIN ${timestamp}] Last auth activity: ${authTimestamp || 'unknown'}, email: ${authEmail || 'unknown'}`);
        
        // Try to recover the session
        checkAndRecoverSession(true).then(recovered => {
          if (recovered) {
            console.log(`[LOGIN ${timestamp}] Session successfully recovered, will redirect`);
            toast({
              title: "Session Restored",
              description: "Your previous session has been restored."
            });
            
            // Wait a little for auth context to update
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 100);
          } else {
            console.log(`[LOGIN ${timestamp}] Session recovery failed - cleaning stale state`);
            // Clean up stale auth flags
            localStorage.removeItem('auth_active');
            localStorage.removeItem('auth_timestamp');
            localStorage.removeItem('auth_email');
          }
        });
      }
    }
  }, [toast, recoveryAttempted, isAuthenticated, authLoading, navigate]);
  
  // Check authentication status and redirect when authenticated
  useEffect(() => {
    const timestamp = new Date().toISOString();
    
    if (!authLoading && isAuthenticated) {
      console.log(`[LOGIN ${timestamp}] User is authenticated, redirecting to dashboard`);
      // Ensure we have saved flags before redirecting
      saveAuthLocalFlagsToSession();
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle login with selected provider with enhanced error handling
  const handleSocialLogin = async (providerName: 'google' | 'linkedin_oidc') => {
    const timestamp = new Date().toISOString();
    
    try {
      setErrorMessage(null);
      setIsLoading(true);
      setProvider(providerName);
      console.log(`[LOGIN ${timestamp}] Attempting to login with ${providerName}...`);
      
      // Reset auth state before login
      performAuthReset();
      
      // Before initiating login, save current flags to session storage
      saveAuthLocalFlagsToSession();
      
      // Reset any stale profile bypass attempts
      localStorage.removeItem('profile_bypass_attempts');
      
      // Log debug info before login attempt
      if (process.env.NODE_ENV === 'development') {
        console.log(`[LOGIN ${timestamp}] Auth state before login:`, getAuthDebugInfo?.());
      }
      
      await login(providerName);
    } catch (error: any) {
      console.error(`[LOGIN ${timestamp}] Login error:`, error);
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

  // Handle email/password login
  const handleLogin = async (data: LoginFormValues) => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      
      console.log(`[LOGIN] Attempting to login with email: ${data.email}`);
      
      // Reset auth state before login
      performAuthReset();
      
      // Save current flags to session storage before login attempt
      saveAuthLocalFlagsToSession();
      
      // Reset any stale profile bypass attempts
      localStorage.removeItem('profile_bypass_attempts');
      
      await loginWithPassword(data.email, data.password);
      
      // If we're still here, we're not redirected yet
      toast({
        title: "Login successful",
        description: "Redirecting you to dashboard...",
      });
      
      // Force redirect after successful login
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error: any) {
      console.error(`[LOGIN] Login error:`, error);
      setErrorMessage(error.message || "There was an error logging in. Please try again.");
      toast({
        title: "Login Failed",
        description: error.message || "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email/password signup with captcha
  const handleSignup = async (data: SignupFormValues) => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      
      console.log(`[SIGNUP] Attempting to create account with email: ${data.email}`);
      
      // Reset auth state before signup
      performAuthReset();
      
      // Save current flags to session storage
      saveAuthLocalFlagsToSession();
      
      // Reset any stale profile bypass attempts
      localStorage.removeItem('profile_bypass_attempts');
      
      if (!data.captchaToken) {
        throw new Error("CAPTCHA verification is required");
      }
      
      await signUp(data.email, data.password, data.captchaToken);
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please check your email for verification.",
      });
      
      // Switch to login tab
      setAuthMode('login');
    } catch (error: any) {
      console.error(`[SIGNUP] Signup error:`, error);
      
      // Enhanced error messages for captcha issues
      if (error.message && (
          error.message.includes('captcha') || 
          error.message.includes('CAPTCHA') ||
          error.message.includes('invalid-input-response')
      )) {
        setErrorMessage("CAPTCHA verification failed. Please complete the CAPTCHA challenge correctly and try again.");
        
        toast({
          title: "CAPTCHA Verification Failed",
          description: "Please complete the CAPTCHA verification and try again.",
          variant: "destructive",
        });
      } else {
        setErrorMessage(error.message || "There was an error creating your account. Please try again.");
        
        toast({
          title: "Signup Failed",
          description: error.message || "There was an error creating your account. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
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
        <LoginPageHeader />
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Writlix</CardTitle>
            <CardDescription>
              Login or sign up to manage your LinkedIn content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthErrorAlert message={errorMessage} />
            
            <Tabs defaultValue="login" value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
                
                <AuthDivider text="Or continue with" />
                
                <SocialLoginButtons 
                  onLogin={handleSocialLogin}
                  isLoading={isLoading}
                  activeProvider={provider}
                  actionType="login"
                />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
                
                <AuthDivider text="Or sign up with" />
                
                <SocialLoginButtons 
                  onLogin={handleSocialLogin}
                  isLoading={isLoading}
                  activeProvider={provider}
                  actionType="signup"
                />
              </TabsContent>
            </Tabs>
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
        
        {/* Debug panel with auth information */}
        <DebugPanel 
          authInfo={{
            isAuthenticated,
            authLoading,
            recoveryAttempted,
            localStorage: {
              profile_completed: localStorage.getItem('profile_completed'),
              profile_skip_attempted: localStorage.getItem('profile_skip_attempted'),
              profile_bypass_attempts: localStorage.getItem('profile_bypass_attempts'),
              auth_active: localStorage.getItem('auth_active'),
              auth_timestamp: localStorage.getItem('auth_timestamp'),
              auth_email: localStorage.getItem('auth_email'),
            },
            sessionStorage: {
              auth_flow_started: sessionStorage.getItem('auth_flow_started'),
              auth_provider: sessionStorage.getItem('auth_provider'),
              auth_local_flags: sessionStorage.getItem('auth_local_flags'),
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;
