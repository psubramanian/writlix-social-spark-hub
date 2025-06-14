import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import { credentialsOperations } from '@/utils/supabaseHelpers';

interface FacebookProfileData {
  name?: string;
  id?: string;
  [key: string]: any;
}

function isFacebookCredentialData(
  obj: any
): obj is {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token: string;
  facebook_profile_data: any;
} {
  return (
    obj &&
    typeof obj === "object" &&
    "client_id" in obj &&
    "client_secret" in obj &&
    "redirect_uri" in obj
  );
}

const FacebookOAuth = () => {
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
        const data = await credentialsOperations.facebook.fetch(user.id);

        if (isFacebookCredentialData(data)) {
          setCredentialsPresent(!!data.client_id);
          setRedirectUri(data.redirect_uri || (window.location.origin + window.location.pathname));

          if (data.access_token) {
            setIsConnected(true);

            if (data.facebook_profile_data) {
              const profileData = data.facebook_profile_data as FacebookProfileData;
              if (profileData && typeof profileData === 'object' && profileData.name) {
                setProfileName(profileData.name);
              }
            }
          }
        } else {
          setCredentialsPresent(false);
          setRedirectUri(window.location.origin + window.location.pathname);
        }
      } catch (error) {
        console.error('Error checking Facebook connection:', error);
        toast({
          title: "Error",
          description: "Failed to check Facebook connection status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [user, toast]);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const savedState = sessionStorage.getItem('facebook_state');

      if (code || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (error) {
        toast({
          title: "Facebook Connection Failed",
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
          sessionStorage.removeItem('facebook_state');

          const credentials = await credentialsOperations.facebook.fetch(user.id);

          const finalRedirectUri =
            isFacebookCredentialData(credentials) && credentials.redirect_uri
              ? credentials.redirect_uri
              : window.location.origin + window.location.pathname;

          console.log('Using redirect URI:', finalRedirectUri);

          const { data, error } = await fetch('/api/facebook-oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              state,
              user_id: user.id,
              redirect_uri: finalRedirectUri
            })
          }).then(res => res.json());

          if (error) throw error;

          if (data.success) {
            setIsConnected(true);
            setProfileName(data.profile.name);

            toast({
              title: "Facebook Connected",
              description: "Your Facebook account has been successfully connected",
            });
          } else {
            throw new Error(data.error || 'Failed to connect Facebook account');
          }
        } catch (error: any) {
          console.error('Facebook OAuth error:', error);
          toast({
            title: "Facebook Connection Failed",
            description: error.message || "Failed to connect Facebook account",
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
          description: "Please log in to connect your Facebook account",
          variant: "destructive",
        });
        return;
      }

      const credentials = await credentialsOperations.facebook.fetch(user.id);

      if (!isFacebookCredentialData(credentials)) {
        toast({
          title: "Facebook Credentials Missing",
          description: "Please add your Facebook API credentials in the Settings page first",
          variant: "destructive",
        });
        return;
      }

      const state = generateRandomString();
      sessionStorage.setItem('facebook_state', state);

      const finalRedirectUri = credentials.redirect_uri || (window.location.origin + window.location.pathname);
      const encodedRedirectUri = encodeURIComponent(finalRedirectUri);

      console.log('Using redirect URI:', finalRedirectUri);

      const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${credentials.client_id}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,public_profile`;

      window.location.href = facebookAuthUrl;
    } catch (error: any) {
      console.error('Error initiating Facebook connection:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Facebook",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      if (!user?.id) return;

      const { error } = await credentialsOperations.facebook.updateTokens(user.id, {
        access_token: null,
        long_lived_token: null,
        expires_at: null,
        facebook_user_id: null,
        facebook_profile_data: null
      });

      if (error) throw error;

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "Facebook Disconnected",
        description: "Your Facebook account has been disconnected",
      });
    } catch (error: any) {
      console.error('Error disconnecting Facebook account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Facebook account",
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
          <AlertTitle className="text-blue-800">Connecting to Facebook</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finalizing your Facebook connection...
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
            <AlertTitle className="text-green-800">Facebook Connected</AlertTitle>
            <AlertDescription>
              Your Facebook account ({profileName || 'Facebook User'}) is successfully connected to Writlix.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">Facebook</h3>
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
            To connect your Facebook account, you'll need to authorize Writlix to post on your behalf.
            After clicking the button below, you'll be redirected to Facebook to complete the authorization.
          </p>

          <Button onClick={handleConnect} disabled={!credentialsPresent}>
            Connect Facebook Account
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            By connecting your Facebook account, you authorize Writlix to post content on your behalf.
            You can revoke this access at any time.
          </p>
        </div>
      )}
    </div>
  );
};

export default FacebookOAuth;
