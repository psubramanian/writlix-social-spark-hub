import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { ensureProfileExists, isProfileComplete } from "@/utils/supabaseUserUtils";
import { UserProfile } from "@/types/auth";

export interface ExtendedUser extends SupabaseUser {
  name?: string;
  avatar?: string;
  linkedInConnected?: boolean;
  profileComplete?: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (provider: 'google' | 'linkedin_oidc') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authInitialized = useRef(false);
  const { toast } = useToast();
  const authStateChangeCount = useRef(0);
  const debugMode = useRef(true);

  const logDebug = (message: string, ...args: any[]) => {
    if (debugMode.current) {
      console.log(`[AUTH DEBUG] ${message}`, ...args);
    }
  };

  const fetchUserProfile = async (userId: string, sessionUser: SupabaseUser) => {
    try {
      const profile = await ensureProfileExists(userId);
      return profile;
    } catch (error) {
      console.error('[AUTH] Error fetching/creating user profile:', error);
      return null;
    }
  };

  const processUserData = async (sessionData: Session | null) => {
    if (!sessionData?.user) {
      logDebug("No session or user found in processUserData");
      return null;
    }
    
    try {
      const profile = await fetchUserProfile(sessionData.user.id, sessionData.user);
      const userData = sessionData.user as ExtendedUser;
      
      userData.name = profile?.full_name || 'User';
      userData.avatar = profile?.avatar_url || null;
      userData.linkedInConnected = profile?.provider === 'linkedin_oidc';
      userData.profileComplete = profile ? isProfileComplete(profile) : true;
      
      logDebug(`Profile completion status:`, {
        databaseFlag: profile?.profile_completed, 
        localStorageFlag1: localStorage.getItem('profile_completed') === 'true',
        localStorageFlag2: localStorage.getItem('profile_skip_attempted') === 'true',
        finalDecision: userData.profileComplete
      });
      
      return userData;
    } catch (error) {
      console.error('[AUTH] Unexpected error in processUserData:', error);
      const userData = sessionData.user as ExtendedUser;
      userData.name = sessionData.user.email?.split('@')[0] || 'User';
      userData.profileComplete = true;
      return userData;
    }
  };

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
            logDebug(`Session updated on auth state change`);
            return newSession;
          }
          return prevSession;
        });
        
        if (event === 'SIGNED_OUT') {
          console.log(`[AUTH ${count}] User signed out, clearing state`);
          setUser(null);
          setIsLoading(false);
          // Clear any auth flow state
          sessionStorage.removeItem('auth_flow_started');
          sessionStorage.removeItem('auth_provider');
          sessionStorage.removeItem('auth_redirect_url');
        }

        // Handle successful sign in
        if (event === 'SIGNED_IN' && newSession) {
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
        logDebug(`Redirecting to ${provider} auth URL: ${data.url}`);
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
      localStorage.removeItem('profile_skip_attempted');
      localStorage.removeItem('profile_completed');
      localStorage.removeItem('profile_bypass_attempts');
      localStorage.removeItem('auth_active');
      localStorage.removeItem('auth_timestamp');
      sessionStorage.removeItem('auth_flow_started');
      sessionStorage.removeItem('auth_provider');
      sessionStorage.removeItem('auth_redirect_url');
      
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
          auth_redirect_url: sessionStorage.getItem('auth_redirect_url')
        }
      });
    }
  }, [user, session, isLoading]);

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!session,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
