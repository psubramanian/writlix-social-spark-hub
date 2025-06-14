
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser

interface FacebookProfileData {
  name?: string;
  id?: string;
  [key: string]: any;
}

const SimpleFacebookConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  // Wait for user to be loaded before proceeding
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> Initializing Facebook Connection...
      </div>
    );
  }

  const checkConnection = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_facebook_credentials')
        .select('access_token, facebook_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.access_token) {
        setIsConnected(true);
        const profile = data.facebook_profile_data as FacebookProfileData;
        if (profile?.name) {
          setProfileName(profile.name);
        }
      }
    } catch (error) {
      console.error('Error checking Facebook connection:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user]);

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

      if (code && state && savedState && state === savedState && user?.id) {
        setConnecting(true);
        try {
          sessionStorage.removeItem('facebook_state');

          const { data, error } = await supabase.functions.invoke('facebook-oauth-simple', {
            body: {
              code,
              state,
              user_id: user.id,
            },
          });

          if (error) throw error;

          if (data.success) {
            setIsConnected(true);
            setProfileName(data.profile.name);

            toast({
              title: "Facebook Connected",
              description: "Your Facebook account has been successfully connected",
            });

            window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
              detail: { platform: 'facebook', connected: true }
            }));
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

      const state = generateRandomString();
      sessionStorage.setItem('facebook_state', state);

      // Get the proper OAuth URL from our centralized endpoint
      const { data, error } = await supabase.functions.invoke('get-facebook-auth-url', {
        body: { state }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to generate Facebook authorization URL');
      }

      window.location.href = data.authUrl;
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

      const { error } = await supabase
        .from('user_facebook_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "Facebook Disconnected",
        description: "Your Facebook account has been disconnected",
      });

      window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
        detail: { platform: 'facebook', connected: false }
      }));
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
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800">Connecting to Facebook</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finalizing your Facebook connection...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {isConnected ? (
        <>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Facebook Connected</AlertTitle>
            <AlertDescription>
              Connected as {profileName || 'Facebook User'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Facebook</h3>
                <p className="text-sm text-muted-foreground">{profileName}</p>
              </div>
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
        <div className="text-center space-y-4 p-6 border rounded-lg">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect your Facebook</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share your content directly to Facebook with one click
            </p>
          </div>
          <Button onClick={handleConnect} className="bg-blue-500 hover:bg-blue-600">
            Connect Facebook
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimpleFacebookConnection;
