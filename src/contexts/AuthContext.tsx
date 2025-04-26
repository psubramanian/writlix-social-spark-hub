
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

// Extended User type with our custom properties
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
  const { toast } = useToast();

  // Process user data and add our custom properties
  const processUserData = (session: Session | null) => {
    if (!session?.user) return null;
    
    const userData = session.user as ExtendedUser;
    
    // Extract properties from user metadata or set defaults
    userData.name = userData.user_metadata?.full_name || 
                    userData.user_metadata?.name || 
                    'User';
                    
    userData.avatar = userData.user_metadata?.avatar_url || 
                     userData.user_metadata?.picture || 
                     null;
                     
    // Check if user connected with LinkedIn - this is just an example condition
    userData.linkedInConnected = userData.app_metadata?.provider === 'linkedin_oidc' ||
                                Boolean(userData.user_metadata?.linkedin_connected);
                                
    return userData;
  };

  // Create or ensure profile exists
  const ensureProfileExists = async (userId: string, userData: ExtendedUser) => {
    try {
      console.log("Checking if profile exists for user:", userId);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error checking for profile:", fetchError);
        throw fetchError;
      }
      
      // If profile doesn't exist, create it
      if (!existingProfile) {
        console.log("Creating profile for user:", userId);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: userData.name,
            avatar_url: userData.avatar,
            email: userData.email,
            provider: userData.app_metadata?.provider
          });
        
        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }
        
        console.log("Profile created successfully");
      } else {
        console.log("Profile already exists");
      }
    } catch (error) {
      console.error("Error in ensureProfileExists:", error);
      // Don't throw error here - we want auth to succeed even if profile creation fails
    }
  };

  // Create or ensure subscription exists
  const ensureSubscriptionExists = async (userId: string) => {
    try {
      console.log("Checking if subscription exists for user:", userId);
      
      // Check if subscription exists
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error checking for subscription:", fetchError);
        throw fetchError;
      }
      
      // If subscription doesn't exist, create trial subscription
      if (!existingSubscription) {
        console.log("Creating trial subscription for user:", userId);
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial
        
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            status: 'trial',
            active_till: trialEndDate.toISOString(),
            first_login_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating subscription:", insertError);
          throw insertError;
        }
        
        console.log("Trial subscription created successfully");
      } else {
        console.log("Subscription already exists");
      }
    } catch (error) {
      console.error("Error in ensureSubscriptionExists:", error);
      // Don't throw error here - we want auth to succeed even if subscription creation fails
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        
        const processedUser = processUserData(session);
        setUser(processedUser);
        
        // If user is authenticated, ensure profile and subscription exist
        if (event === 'SIGNED_IN' && session?.user?.id && processedUser) {
          // Use setTimeout to defer these operations to avoid blocking auth flow
          setTimeout(() => {
            ensureProfileExists(session.user.id, processedUser);
            ensureSubscriptionExists(session.user.id);
          }, 0);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      
      const processedUser = processUserData(session);
      setUser(processedUser);
      
      // If session exists, ensure profile and subscription
      if (session?.user?.id && processedUser) {
        ensureProfileExists(session.user.id, processedUser);
        ensureSubscriptionExists(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setIsLoading(true);
      
      // Get the current URL for redirection
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log(`Starting ${provider} login, will redirect to:`, redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            // For Google auth
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
