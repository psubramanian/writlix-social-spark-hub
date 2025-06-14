import { useState, useEffect, useRef, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { supabase, checkAndRecoverSession, getSessionStatus, cleanupAuthStorage } from "@/integrations/supabase/client";
import { ExtendedUser, AuthContextType } from "./types";
import { processUserData, logDebug } from "./utils";
import { clearAuthLocalStorage, restoreAuthLocalFlags, performAuthReset } from "@/utils/auth/storageUtils";

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initComplete, setInitComplete] = useState(false);  // Added initialization flag
  const authInitialized = useRef(false);
  const { toast } = useToast();
  const authStateChangeCount = useRef(0);
  const debugMode = useRef(process.env.NODE_ENV === 'development');

  // Add initialization timestamp for debugging
  const initTimestamp = useRef(new Date().toISOString());
  
  // Add a ref to track active profile loading to prevent race conditions
  const isLoadingProfile = useRef(false);
  
  // Enhanced profile loading with retry logic and race condition protection
  const loadUserProfile = useCallback(async (currentSession: Session) => {
    if (isLoadingProfile.current) {
      console.log(`[AUTH ${new Date().toISOString()}] Profile already loading, skipping duplicate load`);
      return;
    }
    
    try {
      isLoadingProfile.current = true;
      const userData = await processUserData(currentSession);
      
      if (userData) {
        console.log(`[AUTH ${new Date().toISOString()}] User profile loaded successfully:`, 
          userData.email,
          "Profile complete:", userData.profileComplete ? "Yes" : "No"
        );
        setUser(userData);
      }
    } catch (error) {
      console.error('[AUTH] Error loading user profile:', error);
    } finally {
      isLoadingProfile.current = false;
    }
  }, []);
  
  // Implement session recovery with retry logic
  const attemptSessionRecovery = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH ${timestamp}] Attempting session recovery`);
    
    try {
      // Try to restore any auth flags from session storage
      restoreAuthLocalFlags();
      
      // Check for and recover session
      const sessionExists = await checkAndRecoverSession(true);
      
      if (sessionExists) {
        console.log(`[AUTH ${timestamp}] Session recovery successful`);
        // Allow normal authentication flow to continue
        return true;
      } else {
        console.log(`[AUTH ${timestamp}] No session found during recovery`);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error(`[AUTH ${timestamp}] Session recovery failed:`, error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Initial setup of auth state listener - improved to prevent race conditions
  useEffect(() => {
    if (authInitialized.current) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[AUTH ${timestamp}] Initializing auth context - ONCE ONLY`);
    authInitialized.current = true;
    
    // Store initialization timestamp
    initTimestamp.current = timestamp;
    
    try {
      // Set up auth state listener first, before checking current session
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          const eventTimestamp = new Date().toISOString();
          authStateChangeCount.current += 1;
          const count = authStateChangeCount.current;
          
          console.log(`[AUTH ${eventTimestamp}] (#${count}) Auth state changed: ${event}`, 
            newSession?.user?.email || 'No user'
          );
          
          // Use synchronous state updates first
          if (event === 'SIGNED_OUT') {
            console.log(`[AUTH ${eventTimestamp}] (#${count}) User signed out, clearing state`);
            setUser(null);
            setSession(null);
            setIsLoading(false);
            // Use the comprehensive cleanup
            performAuthReset();
          }
          
          // Update session state if different
          if (JSON.stringify(session) !== JSON.stringify(newSession)) {
            console.log(`[AUTH ${eventTimestamp}] (#${count}) Session updated`);
            setSession(newSession);
          }
          
          // Handle successful sign in with delayed profile loading
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
            console.log(`[AUTH ${eventTimestamp}] (#${count}) Processing sign in event`);
            
            // Reset bypass attempts counter on sign in
            localStorage.removeItem('profile_bypass_attempts');
            localStorage.setItem('auth_active', 'true');
            localStorage.setItem('auth_timestamp', eventTimestamp);
            localStorage.setItem('auth_email', newSession.user?.email || '');
            
            // Use setTimeout to avoid any potential auth deadlocks
            setTimeout(() => {
              loadUserProfile(newSession);
            }, 20);
            
            // Check for auth flow and handle redirect
            const authFlowStarted = sessionStorage.getItem('auth_flow_started');
            const redirectUrl = sessionStorage.getItem('auth_redirect_url');
            
            if (authFlowStarted && redirectUrl) {
              console.log(`[AUTH ${eventTimestamp}] (#${count}) Auth flow detected, will redirect to:`, redirectUrl);
              
              // Clear auth flow state
              sessionStorage.removeItem('auth_flow_started');
              sessionStorage.removeItem('auth_provider');
              sessionStorage.removeItem('auth_redirect_url');
              
              // Set loading to false before redirect
              setIsLoading(false);
              
              // Redirect to the stored URL after a short delay
              // This gives time for other auth state updates to complete
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 150);
            } else {
              // No redirect needed, just update the loading state
              setTimeout(() => {
                setIsLoading(false);
              }, 50);
            }
          }
        }
      );
      
      // Then check for existing session with a small delay to ensure listener is ready
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
          const checkTimestamp = new Date().toISOString();
          
          if (error) {
            console.error(`[AUTH ${checkTimestamp}] Error getting current session:`, error);
            setIsLoading(false);
            setInitComplete(true);
            return;
          }
          
          console.log(`[AUTH ${checkTimestamp}] Initial session check:`, 
            currentSession ? 'Session found' : 'No session'
          );
          
          setSession(currentSession);
          
          if (currentSession) {
            // Load user profile after a short delay
            setTimeout(() => {
              loadUserProfile(currentSession)
                .finally(() => {
                  setIsLoading(false);
                  setInitComplete(true);
                });
            }, 20);
          } else {
            // No session found
            setIsLoading(false);
            setInitComplete(true);
          }
        });
      }, 10);
      
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error(`[AUTH ${timestamp}] Error during auth initialization:`, error);
      setIsLoading(false);
      setInitComplete(true);
    }
  }, [loadUserProfile]);
  
  // Add a safety mechanism to prevent infinite loading state
  useEffect(() => {
    // If still loading after 3 seconds, force complete
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("[AUTH] Safety timeout reached - forcing loading state to complete");
        setIsLoading(false);
        setInitComplete(true);
      }
    }, 3000); // Reduced from 5s to 3s for faster recovery
    
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);
  
  // Add recovery mechanism if no session is detected by the time initialization completes
  useEffect(() => {
    if (initComplete && !session && !user) {
      // Check for signs that we might have a broken session
      const hasAuthFlag = localStorage.getItem('auth_active') === 'true';
      
      if (hasAuthFlag) {
        attemptSessionRecovery();
      }
    }
  }, [initComplete, session, user, attemptSessionRecovery]);

  // Handle social provider login
  const login = async (provider: 'google' | 'linkedin_oidc') => {
    const timestamp = new Date().toISOString();
    
    try {
      setIsLoading(true);
      
      // First clear any existing auth state to prevent conflicts
      performAuthReset();
      
      // Try a global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log(`[AUTH ${timestamp}] Performed global sign out before login`);
      } catch (signOutError) {
        // Just log the error but continue
        console.warn(`[AUTH ${timestamp}] Error during pre-login sign out:`, signOutError);
      }
      
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log(`[AUTH ${timestamp}] Starting ${provider} login, will redirect to:`, redirectTo);
      
      // Clear any prior auth flow data
      sessionStorage.removeItem('auth_flow_started');
      sessionStorage.removeItem('auth_provider');
      sessionStorage.removeItem('auth_redirect_url');
      
      // Store auth flow information
      sessionStorage.setItem('auth_flow_started', 'true');
      sessionStorage.setItem('auth_provider', provider);
      sessionStorage.setItem('auth_redirect_url', redirectTo);
      
      // Store existing profile flags in sessionStorage before redirect
      try {
        const flags = {
          profile_completed: localStorage.getItem('profile_completed'),
          profile_skip_attempted: localStorage.getItem('profile_skip_attempted')
        };
        sessionStorage.setItem('auth_local_flags', JSON.stringify(flags));
        
        console.log(`[AUTH ${timestamp}] Stored auth flags for recovery:`, flags);
      } catch (e) {
        console.warn(`[AUTH ${timestamp}] Error storing auth flags:`, e);
      }
      
      // Reset bypass attempts counter
      localStorage.removeItem('profile_bypass_attempts');
      
      // Set auth_active flag
      localStorage.setItem('auth_active', 'true');
      localStorage.setItem('auth_timestamp', timestamp);
      
      // Initiate OAuth sign-in without flowType property
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            ...(provider === 'google' && {
              access_type: 'offline',
              prompt: 'select_account',
            })
          }
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        logDebug(debugMode.current, `Redirecting to ${provider} auth URL: ${data.url}`);
        
        // Add a small delay before redirect to ensure all state is saved
        setTimeout(() => {
          window.location.href = data.url;
        }, 100);
      } else {
        throw new Error(`Authentication with ${provider} failed. No redirect URL returned.`);
      }
    } catch (error: any) {
      console.error(`[AUTH ${timestamp}] Login error:`, error);
      setIsLoading(false);
      
      // Clean up the auth flags since login failed
      localStorage.removeItem('auth_active');
      localStorage.removeItem('auth_timestamp');
      
      toast({
        title: "Login Failed",
        description: error.message || "There was an error signing in.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Add email/password login
  const loginWithPassword = async (email: string, password: string) => {
    const timestamp = new Date().toISOString();
    
    try {
      setIsLoading(true);
      console.log(`[AUTH ${timestamp}] Attempting email/password login for: ${email}`);
      
      // Clear any existing auth state first
      performAuthReset();
      
      // Try a global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log(`[AUTH ${timestamp}] Performed global sign out before login`);
      } catch (signOutError) {
        // Just log the error but continue
        console.warn(`[AUTH ${timestamp}] Error during pre-login sign out:`, signOutError);
      }
      
      // Store flag to indicate auth is in progress
      localStorage.setItem('auth_active', 'true');
      localStorage.setItem('auth_timestamp', timestamp);
      localStorage.setItem('auth_email', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log(`[AUTH ${timestamp}] Email login successful for: ${email}`);
      
      // Update session manually since we're not redirecting
      if (data?.session) {
        setSession(data.session);
        
        // Use setTimeout to avoid auth deadlocks
        setTimeout(() => {
          loadUserProfile(data.session!);
          setIsLoading(false);
        }, 20);
      } else {
        setIsLoading(false);
      }
      
      return data;
    } catch (error: any) {
      console.error(`[AUTH ${timestamp}] Email login error:`, error);
      localStorage.removeItem('auth_active');
      setIsLoading(false);
      
      toast({
        title: "Login Failed",
        description: error.message || "There was an error signing in with email and password.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Update signUp to handle captchaToken
  const signUp = async (email: string, password: string, captchaToken?: string) => {
    const timestamp = new Date().toISOString();
    
    try {
      setIsLoading(true);
      console.log(`[AUTH ${timestamp}] Creating new account for: ${email}`);
      
      // Clear any existing auth state first
      performAuthReset();
      
      // Validate captcha token if provided
      if (captchaToken) {
        console.log(`[AUTH ${timestamp}] Validating captcha token`);
        
        try {
          const { error } = await supabase.functions.invoke('validate-recaptcha', {
            body: { token: captchaToken }
          });
          
          if (error) {
            console.error(`[AUTH ${timestamp}] Captcha validation error:`, error);
            throw new Error("CAPTCHA verification failed. Please try again.");
          }
        } catch (captchaError: any) {
          console.error(`[AUTH ${timestamp}] Captcha validation error:`, captchaError);
          throw new Error("CAPTCHA verification failed. Please try again.");
        }
      } else if (process.env.NODE_ENV === 'production') {
        // In production, always require captcha
        throw new Error("CAPTCHA verification is required");
      }
      
      const options: any = {
        emailRedirectTo: `${window.location.origin}/login`
      };
      
      // We still pass the captchaToken to Supabase as it has its own verification
      if (captchaToken) {
        options.captchaToken = captchaToken;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      
      if (error) throw error;
      
      console.log(`[AUTH ${timestamp}] Account creation successful for: ${email}`);
      console.log(`[AUTH ${timestamp}] Email confirmation status:`, data?.user?.email_confirmed_at ? 'Confirmed' : 'Needs confirmation');
      
      return data;
    } catch (error: any) {
      console.error(`[AUTH ${timestamp}] Signup error:`, error);
      setIsLoading(false);
      
      toast({
        title: "Signup Failed",
        description: error.message || "There was an error creating your account.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const timestamp = new Date().toISOString();
    
    try {
      setIsLoading(true);
      console.log(`[AUTH ${timestamp}] Logging out user`);
      
      // First try to perform a comprehensive auth reset
      performAuthReset();
      
      // Attempt global sign out to invalidate on all devices
      try {
        const { error } = await supabase.auth.signOut({
          scope: 'global' // Sign out from all tabs/devices
        });
        
        if (error) {
          console.error(`[AUTH ${timestamp}] Sign out API error:`, error);
        }
      } catch (signOutError) {
        console.error(`[AUTH ${timestamp}] Error during sign out:`, signOutError);
      }
      
      // Explicitly set user and session state to null to ensure UI updates
      setUser(null);
      setSession(null);
      
      console.log(`[AUTH ${timestamp}] User logged out successfully`);
      
      // Show success toast
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to home page after logout
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error: any) {
      console.error(`[AUTH ${timestamp}] Logout error:`, error);
      toast({
        title: "Logout Failed",
        description: error.message || "There was an error signing out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    const timestamp = new Date().toISOString();
    
    if (!session?.user) {
      console.log(`[AUTH ${timestamp}] Cannot refresh profile: No active session`);
      return;
    }
    
    console.log(`[AUTH ${timestamp}] Refreshing user profile`);
    return loadUserProfile(session);
  }, [session, loadUserProfile]);
  
  // Export session status for debugging
  const getAuthDebugInfo = useCallback(() => {
    return {
      sessionStatus: getSessionStatus(),
      initTimestamp: initTimestamp.current,
      authStateChangeCount: authStateChangeCount.current,
      isLoadingProfile: isLoadingProfile.current,
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
        auth_redirect_url: sessionStorage.getItem('auth_redirect_url'),
        auth_local_flags: sessionStorage.getItem('auth_local_flags')
      }
    };
  }, []);

  // Enhanced debug logging on changes to authentication state
  useEffect(() => {
    if (debugMode.current) {
      console.log("[AUTH DEBUG] Auth state updated:", { 
        isAuthenticated: !!session,
        isLoading,
        initComplete,
        user: user ? { 
          id: user.id,
          email: user.email,
          profileComplete: user.profileComplete 
        } : null
      });
    }
    
    // Log debug info for query parameter debug mode
    if (window.location.search.includes('auth_debug=true')) {
      console.log("[AUTH DEBUG] Full auth state:", getAuthDebugInfo());
    }
  }, [user, session, isLoading, initComplete, getAuthDebugInfo]);

  return {
    user,
    session,
    isLoading,
    login,
    loginWithPassword,
    signUp,
    logout,
    isAuthenticated: !!session,
    refreshUserProfile,
    getAuthDebugInfo // Add debug function to context
  };
}
