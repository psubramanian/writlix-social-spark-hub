
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedUser, AuthContextType } from "./types";
import { processUserData, logDebug, clearAuthLocalStorage } from "./utils";

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authInitialized = useRef(false);
  const { toast } = useToast();
  const authStateChangeCount = useRef(0);
  const debugMode = useRef(true);

  useEffect(() => {
    if (authInitialized.current) {
      return;
    }

    console.log("[AUTH] Initializing auth context - ONCE ONLY");
    authInitialized.current = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        authStateChangeCount.current += 1;
        const count = authStateChangeCount.current;
        console.log(`[AUTH ${count}] Auth state changed: ${event}`, newSession?.user?.email || 'No user');
        
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(newSession)) {
            logDebug(debugMode.current, `Session updated on auth state change`);
            return newSession;
          }
          return prevSession;
        });
        
        if (event === 'SIGNED_OUT') {
          console.log(`[AUTH ${count}] User signed out, clearing state`);
          setUser(null);
          setIsLoading(false);
          clearAuthLocalStorage();
        }

        // Handle successful sign in
        if (event === 'SIGNED_IN' && newSession) {
          // Always reset the bypass attempts counter on sign in
          localStorage.removeItem('profile_bypass_attempts');
          
          const userData = await processUserData(newSession);
          if (userData) {
            setUser(userData);
            // Check for auth flow and handle redirect
            const authFlowStarted = sessionStorage.getItem('auth_flow_started');
            const redirectUrl = sessionStorage.getItem('auth_redirect_url');
            if (authFlowStarted && redirectUrl) {
              // Clear auth flow state
              sessionStorage.removeItem('auth_flow_started');
              sessionStorage.removeItem('auth_provider');
              sessionStorage.removeItem('auth_redirect_url');
              // Redirect to the stored URL
              window.location.href = redirectUrl;
            }
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        const userData = await processUserData(session);
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('[AUTH] Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [session]);

  const login = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setIsLoading(true);
      
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log(`[AUTH] Starting ${provider} login, will redirect to:`, redirectTo);
      
      // Store auth flow information
      sessionStorage.setItem('auth_flow_started', 'true');
      sessionStorage.setItem('auth_provider', provider);
      sessionStorage.setItem('auth_redirect_url', redirectTo);
      
      // Store existing profile flags in sessionStorage before redirect
      // This helps restore them if they get lost during auth redirect
      try {
        const flags = {
          profile_completed: localStorage.getItem('profile_completed'),
          profile_skip_attempted: localStorage.getItem('profile_skip_attempted')
        };
        sessionStorage.setItem('auth_local_flags', JSON.stringify(flags));
      } catch (e) {
        console.warn('[AUTH] Error storing auth flags:', e);
      }
      
      // Reset bypass attempts counter
      localStorage.removeItem('profile_bypass_attempts');
      
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
        window.location.href = data.url;
      } else {
        throw new Error(`Authentication with ${provider} failed. No redirect URL returned.`);
      }
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Logging out user");
      
      // Clear all auth-related storage
      clearAuthLocalStorage();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      console.log("[AUTH] User logged out successfully");
    } catch (error: any) {
      console.error('[AUTH] Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (!session?.user) return;
    const userData = await processUserData(session);
    if (userData) {
      setUser(userData);
    }
  };

  useEffect(() => {
    if (window.location.search.includes('auth_debug=true')) {
      console.log("[AUTH DEBUG] Auth state:", { 
        user, 
        session, 
        isLoading, 
        isAuthenticated: !!session,
        localStorage: {
          profile_completed: localStorage.getItem('profile_completed'),
          profile_skip_attempted: localStorage.getItem('profile_skip_attempted'),
          profile_bypass_attempts: localStorage.getItem('profile_bypass_attempts'),
          auth_active: localStorage.getItem('auth_active')
        },
        sessionStorage: {
          auth_flow_started: sessionStorage.getItem('auth_flow_started'),
          auth_provider: sessionStorage.getItem('auth_provider'),
          auth_redirect_url: sessionStorage.getItem('auth_redirect_url'),
          auth_local_flags: sessionStorage.getItem('auth_local_flags')
        }
      });
    }
  }, [user, session, isLoading]);

  return {
    user,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!session,
    refreshUserProfile
  };
}
