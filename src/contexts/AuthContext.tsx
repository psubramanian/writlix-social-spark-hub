
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { ensureProfileExists } from "@/utils/supabaseUserUtils";

export interface ExtendedUser extends SupabaseUser {
  name?: string;
  avatar?: string;
  linkedInConnected?: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (provider: 'google' | 'linkedin_oidc') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
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

  const fetchUserProfile = async (userId: string, sessionUser: SupabaseUser) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profile) {
        // Try creating a profile if it doesn't exist
        console.log("No profile found, creating one...");
        const createdProfile = await ensureProfileExists(userId, sessionUser);
        if (!createdProfile) {
          console.error('Failed to create profile for user:', userId);
          return null;
        }
        return createdProfile;
      }

      console.log("Profile found:", profile);
      return profile;
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      return null;
    }
  };

  const processUserData = async (sessionData: Session | null) => {
    if (!sessionData?.user) {
      console.log("No session or user found in processUserData");
      return null;
    }
    
    try {
      const profile = await fetchUserProfile(sessionData.user.id, sessionData.user);
      
      if (!profile) {
        console.error('No profile found or created for user:', sessionData.user.id);
        return null;
      }
      
      const userData = sessionData.user as ExtendedUser;
      userData.name = profile.full_name || 'User';
      userData.avatar = profile.avatar_url || null;
      userData.linkedInConnected = profile.provider === 'linkedin_oidc';
      
      return userData;
    } catch (error) {
      console.error('Unexpected error in processUserData:', error);
      return null;
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
            console.log(`[AUTH ${count}] Session updated`);
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
            console.log(`[AUTH ${count}] Initial session updated`);
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
        const processedUser = await processUserData(session);
        
        console.log(`[AUTH] User profile processed:`, processedUser?.email || 'Failed to process');
        
        // Only update if different to prevent loops
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== JSON.stringify(processedUser)) {
            return processedUser;
          }
          return prevUser;
        });
      } catch (error) {
        console.error("[AUTH] Error processing user data:", error);
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
        console.log(`[AUTH] Redirecting to ${provider} auth URL:`, data.url);
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
