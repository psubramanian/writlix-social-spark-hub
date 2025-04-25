
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(processUserData(session));
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(processUserData(session));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      // Get the current URL origin for redirection
      const redirectUrl = window.location.origin + '/dashboard';
      
      const { data: { url }, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          // Use queryParams for captcha instead of captchaToken
          queryParams: {
            captchaRequired: 'true'
          }
        }
      });

      if (error) throw error;
      
      // Redirect to the OAuth provider's login page
      if (url) window.location.href = url;
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
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
