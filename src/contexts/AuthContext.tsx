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

  // Initialize auth once with combined effect to prevent race conditions
  useEffect(() => {
    // Skip if already initialized
    if (authInitialized.current) {
      return;
    }

    console.log("Initializing auth context");
    authInitialized.current = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email);
        
        // First synchronously update the session
        setSession(newSession);
        
        // If signed out, clear user state immediately
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
          return;
        }
      }
    );

    // Get initial session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        setSession(data.session);
        
        // Only set loading to false if there's no session
        // For sessions with users, we'll handle loading state in separate effect
        if (!data.session) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run once

  // Process user data when session changes
  useEffect(() => {
    if (!session) {
      // If no session, make sure loading is false
      setIsLoading(false);
      return;
    }
    
    const loadUserProfile = async () => {
      try {
        console.log("Processing user data for session:", session.user.email);
        const processedUser = await processUserData(session);
        setUser(processedUser);
      } catch (error) {
        console.error("Error processing user data:", error);
      } finally {
        // Always finish loading regardless of success/failure
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
      
      console.log(`Starting ${provider} login, will redirect to:`, redirectTo);
      
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
        console.error(`${provider} login error:`, error);
        throw error;
      }
      
      if (data?.url) {
        console.log(`Redirecting to ${provider} auth URL:`, data.url);
        window.location.href = data.url;
      } else {
        console.error(`No redirect URL returned from ${provider} auth`);
        throw new Error(`Authentication with ${provider} failed. No redirect URL returned.`);
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      console.log("User logged out successfully");
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
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
