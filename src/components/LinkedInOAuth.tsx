
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { credentialsOperations, isValidData } from '@/utils/supabaseHelpers';

// LinkedIn profile structure
interface LinkedInProfileData {
  localizedFirstName?: string;
  localizedLastName?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
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

  const checkConnection = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log('Checking LinkedIn connection for user:', user.id);

    try {
      const data = await credentialsOperations.linkedin.fetch(user.id);

      if (isValidData(data)) {
        const credentials = data as any;
        console.log('LinkedIn credentials found:', { 
          hasClientId: !!credentials.client_id, 
          hasAccessToken: !!credentials.access_token 
        });
        
        if (credentials.client_id) {
          setCredentialsPresent(true);
          setRedirectUri(credentials.redirect_uri || (window.location.origin + window.location.pathname));

          if (credentials.access_token) {
            setIsConnected(true);
            console.log('LinkedIn is connected with access token');

            const profile = credentials.linkedin_profile_data;
            if (profile && typeof profile === 'object') {
              const profileData = profile as LinkedInProfileData;
              const name = profileData.name || 
                         (profileData.given_name && profileData.family_name ? 
                          `${profileData.given_name} ${profileData.family_name}` : 
                          profileData.localizedFirstName ? 
                          `${profileData.localizedFirstName} ${profileData.localizedLastName || ''}` : 
                          'LinkedIn User');
              setProfileName(name.trim() || 'LinkedIn User');
            }
          } else {
            setIsConnected(false);
            console.log('LinkedIn credentials present but no access token');
          }
        } else {
          setCredentialsPresent(false);
          setRedirectUri(window.location.origin + window.location.pathname);
          console.log('No LinkedIn credentials found');
        }
      } else {
        setCredentialsPresent(false);
        setRedirectUri(window.location.origin + window.location.pathname);
        console.log('No LinkedIn data returned');
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

  // Broadcast connection status changes to other components
  const broadcastConnectionChange = () => {
    // Dispatch a custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
      detail: { platform: 'linkedin', connected: isConnected }
    }));
  };

  useEffect(() => {
    checkConnection();
  }, [user, toast]);

  // Broadcast when connection status changes
  useEffect(() => {
    if (!loading) {
      broadcastConnectionChange();
    }
  }, [isConnected, loading]);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      const savedState = sessionStorage.getItem('linkedin_state');

      if (code || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (error) {
        console.error('LinkedIn OAuth error:', error, errorDescription);
        toast({
          title: "LinkedIn Connection Failed",
          description: errorDescription || `Error: ${error}`,
          variant: "destructive",
        });
        return;
      }

      if (code && state && (!savedState || state !== savedState)) {
        console.error('OAuth state mismatch:', { received: state, expected: savedState });
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
          sessionStorage.removeItem('linkedin_state');

          const credentials = await credentialsOperations.linkedin.fetch(user.id);
          let finalRedirectUri = window.location.origin + window.location.pathname;
          
          if (isValidData(credentials)) {
            const creds = credentials as any;
            if (creds.redirect_uri) {
              finalRedirectUri = creds.redirect_uri;
            }
          }

          console.log('Sending OAuth data to backend:', {
            code: code.substring(0, 10) + '...',
            state,
            user_id: user.id,
            redirect_uri: finalRedirectUri
          });

          const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
            body: {
              code,
              state,
              user_id: user.id,
              redirect_uri: finalRedirectUri
            }
          });

          if (error) {
            console.error('LinkedIn OAuth function error:', error);
            throw error;
          }

          console.log('LinkedIn OAuth response:', data);

          if (data?.success) {
            // Refresh the connection status
            await checkConnection();

            toast({
              title: "LinkedIn Connected",
              description: "Your LinkedIn account has been successfully connected",
            });

            // Broadcast the successful connection to other components
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
                detail: { platform: 'linkedin', connected: true }
              }));
            }, 100);
          } else {
            throw new Error(data?.error || 'Failed to connect LinkedIn account');
          }
        } catch (error: any) {
          console.error('LinkedIn OAuth error:', error);
          toast({
            title: "LinkedIn Connection Failed",
            description: error.message || "Failed to connect LinkedIn account. Please check your LinkedIn app configuration and redirect URI.",
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

      const credentials = await credentialsOperations.linkedin.fetch(user.id);

      if (!isValidData(credentials)) {
        toast({
          title: "LinkedIn Credentials Missing",
          description: "Please add your LinkedIn API credentials in the Settings page first",
          variant: "destructive",
        });
        return;
      }

      const creds = credentials as any;
      if (!creds.client_id) {
        toast({
          title: "LinkedIn Credentials Missing",
          description: "Please add your LinkedIn API credentials in the Settings page first",
          variant: "destructive",
        });
        return;
      }

      const state = generateRandomString();
      sessionStorage.setItem('linkedin_state', state);

      let finalRedirectUri = window.location.origin + window.location.pathname;
      if (creds.redirect_uri) {
        finalRedirectUri = creds.redirect_uri;
      }

      console.log('Initiating LinkedIn OAuth with:', {
        client_id: creds.client_id,
        redirect_uri: finalRedirectUri,
        state
      });

      const encodedRedirectUri = encodeURIComponent(finalRedirectUri);

      // Updated OAuth scope with current LinkedIn API requirements
      const scope = "openid profile email w_member_social";
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${creds.client_id}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=${encodeURIComponent(scope)}`;

      console.log('Redirecting to LinkedIn:', linkedInAuthUrl);
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

      const { error } = await credentialsOperations.linkedin.updateTokens(user.id, {
        access_token: null,
        refresh_token: null,
        expires_at: null,
        linkedin_profile_id: null,
        linkedin_profile_data: null
      });

      if (error) throw error;

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "LinkedIn Disconnected",
        description: "Your LinkedIn account has been disconnected",
      });

      // Broadcast the disconnection to other components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
          detail: { platform: 'linkedin', connected: false }
        }));
      }, 100);
    } catch (error: any) {
      console.error('Error disconnecting LinkedIn account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect LinkedIn account",
        variant: "destructive",
      });
    }
  };

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

          {!credentialsPresent && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTitle className="text-amber-800">LinkedIn Credentials Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                Please add your LinkedIn API credentials above before connecting your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground mt-4 space-y-2">
            <p>
              By connecting your LinkedIn account, you authorize Writlix to post content on your behalf.
              You can revoke this access at any time.
            </p>
            <p className="font-medium">
              Important: Make sure your LinkedIn app's redirect URI matches: {redirectUri}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInOAuth;
