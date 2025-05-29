import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface InstagramProfileData {
  username?: string;
  id?: string;
  [key: string]: any;
}

interface InstagramCredentialRow {
  client_id: string;
  redirect_uri?: string;
  access_token?: string;
  instagram_profile_data?: InstagramProfileData;
}

function isInstagramCredentialData(obj: any): obj is InstagramCredentialRow {
  return obj && typeof obj === 'object' && 'client_id' in obj && typeof obj.client_id === 'string';
}

const InstagramOAuth = () => {
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
        const { data, error } = await supabase
          .from('user_instagram_credentials')
          .select('client_id, access_token, instagram_profile_data, redirect_uri')
          .eq('user_id', user.id as any)
          .maybeSingle();

        if (error) throw error;

        if (isInstagramCredentialData(data)) {
          setCredentialsPresent(!!data.client_id);
          setRedirectUri(data.redirect_uri || (window.location.origin + window.location.pathname));

          if (data.access_token) {
            setIsConnected(true);
            const profileData = data.instagram_profile_data;
            if (profileData && typeof profileData === 'object' && profileData.username) {
              setProfileName(profileData.username);
            }
          }
        } else {
          setCredentialsPresent(false);
          setRedirectUri(window.location.origin + window.location.pathname);
        }
      } catch (error) {
        console.error('Error checking Instagram connection:', error);
        toast({
          title: "Error",
          description: "Failed to check Instagram connection status",
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
      const savedState = sessionStorage.getItem('instagram_state');

      if (code || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (error) {
        toast({
          title: "Instagram Connection Failed",
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
          sessionStorage.removeItem('instagram_state');

          const { data: credentials } = await supabase
            .from('user_instagram_credentials')
            .select('redirect_uri')
            .eq('user_id', user.id as any)
            .maybeSingle();

          const finalRedirectUri = (credentials && 'redirect_uri' in credentials ? credentials.redirect_uri : null) || 
            (window.location.origin + window.location.pathname);

          const { data, error } = await supabase.functions.invoke('instagram-oauth', {
            body: {
              code,
              state,
              user_id: user.id,
              redirect_uri: finalRedirectUri,
            },
          });

          if (error) throw error;

          if (data.success) {
            setIsConnected(true);
            setProfileName(data.profile.username || data.profile.name);

            toast({
              title: "Instagram Connected",
              description: "Your Instagram account has been successfully connected",
            });
          } else {
            throw new Error(data.error || 'Failed to connect Instagram account');
          }
        } catch (error: any) {
          console.error('Instagram OAuth error:', error);
          toast({
            title: "Instagram Connection Failed",
            description: error.message || "Failed to connect Instagram account",
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
          description: "Please log in to connect your Instagram account",
          variant: "destructive",
        });
        return;
      }

      const { data: credentials, error: credentialsError } = await supabase
        .from('user_instagram_credentials')
        .select('client_id, redirect_uri')
        .eq('user_id', user.id as any)
        .maybeSingle();

      if (credentialsError) throw credentialsError;

      if (!isInstagramCredentialData(credentials)) {
        toast({
          title: "Instagram Credentials Missing",
          description: "Please add your Instagram API credentials in the Settings page first",
          variant: "destructive",
        });
        return;
      }

      const state = generateRandomString();
      sessionStorage.setItem('instagram_state', state);

      const finalRedirectUri = credentials.redirect_uri || (window.location.origin + window.location.pathname);
      const encodedRedirectUri = encodeURIComponent(finalRedirectUri);

      const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${credentials.client_id}&redirect_uri=${encodedRedirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;

      window.location.href = instagramAuthUrl;
    } catch (error: any) {
      console.error('Error initiating Instagram connection:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Instagram",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('user_instagram_credentials')
        .update({
          access_token: null,
          long_lived_token: null,
          expires_at: null,
          instagram_user_id: null,
          instagram_profile_data: null,
        } as any)
        .eq('user_id', user.id as any);

      if (error) throw error;

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "Instagram Disconnected",
        description: "Your Instagram account has been disconnected",
      });
    } catch (error: any) {
      console.error('Error disconnecting Instagram account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Instagram account",
        variant: "destructive",
      });
    }
  };

  const generateRandomString = (length = 20) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
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
          <AlertTitle className="text-blue-800">Connecting to Instagram</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finalizing your Instagram connection...
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
            <AlertTitle className="text-green-800">Instagram Connected</AlertTitle>
            <AlertDescription>
              Your Instagram account ({profileName || 'Instagram User'}) is successfully connected to Writlix.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">Instagram</h3>
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
            To connect your Instagram account, you'll need to authorize Writlix to post on your behalf.
            After clicking the button below, you'll be redirected to Instagram to complete the authorization.
          </p>

          <Button onClick={handleConnect} disabled={!credentialsPresent}>
            Connect Instagram Account
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            By connecting your Instagram account, you authorize Writlix to post content on your behalf.
            You can revoke this access at any time.
          </p>
        </div>
      )}
    </div>
  );
};

export default InstagramOAuth;
