
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface InstagramProfileData {
  username?: string;
  id?: string;
  [key: string]: any;
}

const SimpleInstagramConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const checkConnection = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_instagram_credentials')
        .select('access_token, instagram_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.access_token) {
        setIsConnected(true);
        const profile = data.instagram_profile_data as InstagramProfileData;
        if (profile?.username) {
          setProfileName(profile.username);
        }
      }
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
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

      if (code && state && savedState && state === savedState && user?.id) {
        setConnecting(true);
        try {
          sessionStorage.removeItem('instagram_state');

          const { data, error } = await supabase.functions.invoke('instagram-oauth-simple', {
            body: {
              code,
              state,
              user_id: user.id,
            },
          });

          if (error) throw error;

          if (data.success) {
            setIsConnected(true);
            setProfileName(data.profile.username);

            toast({
              title: "Instagram Connected",
              description: "Your Instagram account has been successfully connected",
            });

            window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
              detail: { platform: 'instagram', connected: true }
            }));
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

      const state = generateRandomString();
      sessionStorage.setItem('instagram_state', state);

      // Get the proper OAuth URL from our centralized endpoint
      const { data, error } = await supabase.functions.invoke('get-instagram-auth-url', {
        body: { state }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to generate Instagram authorization URL');
      }

      window.location.href = data.authUrl;
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
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "Instagram Disconnected",
        description: "Your Instagram account has been disconnected",
      });

      window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
        detail: { platform: 'instagram', connected: false }
      }));
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
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800">Connecting to Instagram</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finalizing your Instagram connection...
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
            <AlertTitle className="text-green-800">Instagram Connected</AlertTitle>
            <AlertDescription>
              Connected as @{profileName || 'Instagram User'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Instagram</h3>
                <p className="text-sm text-muted-foreground">@{profileName}</p>
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
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect your Instagram</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share your content directly to Instagram with one click
            </p>
          </div>
          <Button onClick={handleConnect} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            Connect Instagram
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimpleInstagramConnection;
