
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { ensureProfileExists } from "@/utils/supabaseUserUtils";
import { UserProfile } from "@/types/auth";

export interface ExtendedUser extends SupabaseUser {
  name?: string;
  avatar?: string;
  linkedInConnected?: boolean;
  profileComplete?: boolean; // Track if profile is complete
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
  const sessionCheckCount = useRef(0);
  const debugMode = useRef(true); // Set to true to enable extra debug logs

  // Helper for debug logging
  const logDebug = (message: string, ...args: any[]) => {
    if (debugMode.current) {
      console.log(`[AUTH DEBUG] ${message}`, ...args);
    }
  };

  const fetchUserProfile = async (userId: string, sessionUser: SupabaseUser) => {
    try {
      logDebug(`Fetching profile for user: ${userId}`);
      
      // Always attempt to create/get profile
      const profile = await ensureProfileExists(userId, sessionUser);
      
      if (!profile) {
        console.error('[AUTH] Failed to get or create profile for user:', userId);
        
        // Return a minimal fallback profile to prevent auth loops
        return {
          id: userId,
          full_name: sessionUser.email?.split('@')[0] || `User-${userId.substring(0, 6)}`,
          email: sessionUser.email,
          _fallback: true
        } as UserProfile;
      }

      // Check if this is a fallback profile by checking the _fallback property
      // The as operator is used to tell TypeScript that we know this property exists
      const isFallbackProfile = (profile as UserProfile)._fallback === true;
      
      if (isFallbackProfile) {
        console.warn('[AUTH] Using fallback profile due to database errors');
        toast({
          title: "Profile Issue",
          description: "We're having trouble saving your profile. Some features may be limited.",
          variant: "destructive",
        });
      } else {
        logDebug(`Profile found or created: ${profile.full_name}`);
      }
      
      return profile as UserProfile;
    } catch (error) {
      console.error('[AUTH] Unexpected error in fetchUserProfile:', error);
      
      // Always return something to prevent auth loops
      return {
        id: userId,
        full_name: sessionUser.email?.split('@')[0] || `User-${userId.substring(0, 6)}`,
        email: sessionUser.email,
        _fallback: true
      } as UserProfile;
    }
  };

  const processUserData = async (sessionData: Session | null) => {
    if (!sessionData?.user) {
      logDebug("No session or user found in processUserData");
      return null;
    }
    
    try {
      const profile = await fetchUserProfile(sessionData.user.id, sessionData.user);
      
      // We'll always have at least a fallback profile now
      const userData = sessionData.user as ExtendedUser;
      
      // Set user data from profile
      userData.name = profile.full_name || 'User';
      userData.avatar = profile.avatar_url || null;
      userData.linkedInConnected = profile.provider === 'linkedin_oidc';
      
      // Cast to UserProfile to access the _fallback property
      const isFallbackProfile = (profile as UserProfile)._fallback === true;
      
      // Check if user has skipped profile completion
      const hasSkippedProfileCompletion = localStorage.getItem('profile_skip_attempted') === 'true';
      const hasCompletedProfile = localStorage.getItem('profile_completed') === 'true';
      
      // If the user has skipped or completed profile, don't mark as incomplete profile
      if (hasSkippedProfileCompletion || hasCompletedProfile) {
        userData.profileComplete = true;
      } else {
        userData.profileComplete = !isFallbackProfile;
      }
      
      return userData;
    } catch (error) {
      console.error('[AUTH] Unexpected error in processUserData:', error);
      
      // Create minimal user to prevent auth loops
      const userData = sessionData.user as ExtendedUser;
      userData.name = sessionData.user.email?.split('@')[0] || 'User';
      userData.profileComplete = false;
      return userData;
    }
  };
  
  // Function to allow explicit refresh of user profile from other components
  const refreshUserProfile = async () => {
    if (!session?.user) {
      console.warn('[AUTH] Cannot refresh profile - no active session');
      return;
    }
    
    logDebug("Manually refreshing user profile");
    
    try {
      const processedUser = await processUserData(session);
      
      // Only update if different to prevent unnecessary rerenders
      setUser(prevUser => {
        if (JSON.stringify(prevUser) !== JSON.stringify(processedUser)) {
          logDebug("Updated user profile data");
          return processedUser;
        }
        return prevUser;
      });
    } catch (error) {
      console.error("[AUTH] Error refreshing user profile:", error);
    }
  };

  // Only run once on component mount to initialize auth
  useEffect(() => {
    // Prevent multiple initializations
    if (authInitialized.current) {
      return;
    }

    console.log("[AUTH] Initializing auth context - ONCE ONLY");
    authInitialized.current = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        authStateChangeCount.current += 1;
        const count = authStateChangeCount.current;
        console.log(`[AUTH ${count}] Auth state changed: ${event}`, newSession?.user?.email || 'No user');
        
        // Update session synchronously
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(newSession)) {
            logDebug(`Session updated on auth state change`);
            return newSession;
          }
          return prevSession;
        });
        
        // If signed out, clear user state immediately
        if (event === 'SIGNED_OUT') {
          console.log(`[AUTH ${count}] User signed out, clearing state`);
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Get initial session
    const checkSession = async () => {
      try {
        sessionCheckCount.current += 1;
        const count = sessionCheckCount.current;
        console.log(`[AUTH ${count}] Checking for initial session`);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error(`[AUTH ${count}] Error getting session:`, error);
          setIsLoading(false);
          return;
        }
        
        console.log(`[AUTH ${count}] Initial session check:`, data.session?.user?.email || 'No active session');
        
        // Only update if different to prevent loops
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(data.session)) {
            logDebug(`Initial session updated`);
            return data.session;
          }
          return prevSession;
        });
        
        // If no session, finish loading
        if (!data.session) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[AUTH] Unexpected error checking session:", error);
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      console.log("[AUTH] Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once only

  // Process user data when session changes
  useEffect(() => {
    // Skip processing if there's no session or if we're already not loading
    if (!session) {
      setIsLoading(false);
      return;
    }
    
    const sessionEmail = session.user?.email;
    console.log(`[AUTH] Processing user data for session:`, sessionEmail || 'No email');

    const loadUserProfile = async () => {
      try {
        // Add retry logic for better reliability
        let attempts = 0;
        let processedUser = null;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !processedUser) {
          attempts++;
          
          try {
            processedUser = await processUserData(session);
            
            if (processedUser) {
              logDebug(`User profile processed after ${attempts} attempt(s)`);
              break;
            }
          } catch (attemptError) {
            console.warn(`[AUTH] Profile processing attempt ${attempts} failed:`, attemptError);
            
            if (attempts >= maxAttempts) {
              throw attemptError;
            }
            
            // Wait a bit before trying again
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Only update if different to prevent loops
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== JSON.stringify(processedUser)) {
            return processedUser;
          }
          return prevUser;
        });
      } catch (error) {
        console.error("[AUTH] Error processing user data:", error);
        
        // Create a minimal user to prevent auth loops
        if (session?.user) {
          setUser({
            ...session.user,
            name: session.user.email?.split('@')[0] || 'User',
            profileComplete: false
          } as ExtendedUser);
        }
      } finally {
        // Always finish loading
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [session]); // Only run when session changes

  const login = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setIsLoading(true);
      
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log(`[AUTH] Starting ${provider} login, will redirect to:`, redirectTo);
      
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

      if (error) {
        console.error(`[AUTH] ${provider} login error:`, error);
        throw error;
      }
      
      if (data?.url) {
        logDebug(`Redirecting to ${provider} auth URL: ${data.url}`);
        
        // Store auth info in session storage for debugging
        sessionStorage.setItem('auth_flow_started', 'true');
        sessionStorage.setItem('auth_provider', provider);
        sessionStorage.setItem('auth_redirect_url', redirectTo);
        
        window.location.href = data.url;
      } else {
        console.error(`[AUTH] No redirect URL returned from ${provider} auth`);
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
      
      // Clear any profile-related localStorage flags
      localStorage.removeItem('profile_skip_attempted');
      localStorage.removeItem('profile_completed');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[AUTH] Logout error:", error);
        throw error;
      }
      
      // Clear state immediately to prevent UI flashing old data
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

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!session,
    refreshUserProfile  // Export this function to allow components to refresh user data
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
