
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Json } from '@/integrations/supabase/types';

// Define types for LinkedIn profile data to avoid TypeScript errors
interface LinkedInProfileData {
  localizedFirstName?: string;
  localizedLastName?: string;
  [key: string]: any;
}

const LinkedInOAuth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentialsPresent, setCredentialsPresent] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  
  useEffect(() => {
    const checkConnection = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if we have LinkedIn credentials stored
        const { data, error } = await supabase
          .from('user_linkedin_credentials')
          .select('client_id, access_token, linkedin_profile_data, redirect_uri')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking LinkedIn connection:', error);
          throw error;
        }
        
        // Only access data properties if data exists and is not an error
        if (data && typeof data === 'object') {
          setCredentialsPresent(!!data.client_id);
          
          if (data.redirect_uri) {
            setRedirectUri(data.redirect_uri);
          } else {
            setRedirectUri(window.location.origin + window.location.pathname);
          }
          
          if (data.access_token) {
            setIsConnected(true);
            
            if (data.linkedin_profile_data) {
              // Safely access linkedin_profile_data
              const profileData = data.linkedin_profile_data as LinkedInProfileData;
              if (profileData && typeof profileData === 'object' && profileData.localizedFirstName) {
                setProfileName(`${profileData.localizedFirstName} ${profileData.localizedLastName || ''}`);
              }
            }
          }
        } else {
          setCredentialsPresent(false);
          setRedirectUri(window.location.origin + window.location.pathname);
        }
      } catch (error) {
        console.error('Error checking LinkedIn connection:', error);
        toast({
          title: "Error",
          description: "Failed to check LinkedIn connection status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkConnection();
  }, [user, toast]);
  
  useEffect(() => {
    // Handle the OAuth callback
    const handleOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const savedState = sessionStorage.getItem('linkedin_state');
      
      // Clean up URL after processing
      if (code || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (error) {
        toast({
          title: "LinkedIn Connection Failed",
          description: `Error: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (code && state && (!savedState || state !== savedState)) {
        toast({
          title: "OAuth State Mismatch",
          description: "OAuth state mismatch. Please try connecting again.",
          variant: "destructive",
        });
        return;
      }
      
      if (code && state && savedState && state === savedState && user?.id) {
        setConnecting(true);
        try {
          // Clear the state from session storage
          sessionStorage.removeItem('linkedin_state');
          
          // Get user's configured redirect URI
          const { data: credentials } = await supabase
            .from('user_linkedin_credentials')
            .select('redirect_uri')
            .eq('user_id', user.id)
            .maybeSingle();
            
          // Use custom redirect URI if available, otherwise use default
          const finalRedirectUri = (credentials && credentials.redirect_uri) || 
            (window.location.origin + window.location.pathname);
            
          console.log('Using redirect URI:', finalRedirectUri);
          
          // Exchange the code for an access token
          const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
            body: { 
              code,
              state,
              user_id: user.id,
              redirect_uri: finalRedirectUri
            }
          });
          
          if (error) throw error;
          
          if (data.success) {
            setIsConnected(true);
            setProfileName(data.profile.name);
            
            toast({
              title: "LinkedIn Connected",
              description: "Your LinkedIn account has been successfully connected",
            });
          } else {
            throw new Error(data.error || 'Failed to connect LinkedIn account');
          }
        } catch (error: any) {
          console.error('LinkedIn OAuth error:', error);
          toast({
            title: "LinkedIn Connection Failed",
            description: error.message || "Failed to connect LinkedIn account",
            variant: "destructive",
          });
        } finally {
          setConnecting(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [toast, user]);
  
  const handleConnect = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please log in to connect your LinkedIn account",
          variant: "destructive",
        });
        return;
      }
      
      // Get user's LinkedIn credentials
      const { data: credentials, error: credentialsError } = await supabase
        .from('user_linkedin_credentials')
        .select('client_id, redirect_uri')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (credentialsError) {
        console.error('Error fetching LinkedIn credentials:', credentialsError);
        throw credentialsError;
      }
      
      // Check if credentials exist and have a client_id
      if (!credentials || !credentials.client_id) {
        toast({
          title: "LinkedIn Credentials Missing",
          description: "Please add your LinkedIn API credentials in the Settings page first",
          variant: "destructive",
        });
        return;
      }
      
      // Generate and store state parameter for security
      const state = generateRandomString();
      sessionStorage.setItem('linkedin_state', state);
      
      // Use custom redirect URI if available, default to current page otherwise
      const finalRedirectUri = credentials.redirect_uri || (window.location.origin + window.location.pathname);
      
      // Get the redirect URI
      const encodedRedirectUri = encodeURIComponent(finalRedirectUri);
      console.log('Using redirect URI:', finalRedirectUri);
      
      // Redirect to LinkedIn authorization page
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${credentials.client_id}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
      
      window.location.href = linkedInAuthUrl;
    } catch (error: any) {
      console.error('Error initiating LinkedIn connection:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to LinkedIn",
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnect = async () => {
    try {
      if (!user?.id) return;
      
      // Update LinkedIn credentials to remove access token
      const { error } = await supabase
        .from('user_linkedin_credentials')
        .update({ 
          access_token: null,
          refresh_token: null,
          expires_at: null,
          linkedin_profile_id: null,
          linkedin_profile_data: null
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setIsConnected(false);
      setProfileName('');
      
      toast({
        title: "LinkedIn Disconnected",
        description: "Your LinkedIn account has been disconnected",
      });
    } catch (error: any) {
      console.error('Error disconnecting LinkedIn account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect LinkedIn account",
        variant: "destructive",
      });
    }
  };

  // Generate a random string for the state parameter
  const generateRandomString = (length = 20) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (connecting) {
    return (
      <div className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">Connecting to LinkedIn</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finalizing your LinkedIn connection...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isConnected ? (
        <>
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertTitle className="text-green-800">LinkedIn Connected</AlertTitle>
            <AlertDescription>
              Your LinkedIn account ({profileName || 'LinkedIn User'}) is successfully connected to Writlix.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">LinkedIn</h3>
              <p className="text-sm text-muted-foreground">Connected account</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="text-red-500 hover:text-red-700 hover:border-red-200"
            >
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">
            To connect your LinkedIn account, you'll need to authorize Writlix to post on your behalf.
            After clicking the button below, you'll be redirected to LinkedIn to complete the authorization.
          </p>
          
          <Button onClick={handleConnect} disabled={!credentialsPresent}>
            Connect LinkedIn Account
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            By connecting your LinkedIn account, you authorize Writlix to post content on your behalf.
            You can revoke this access at any time.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkedInOAuth;
