
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, Settings } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser
import LinkedInPageSelector from './LinkedInPageSelector';

interface LinkedInProfileData {
  name?: string;
  given_name?: string;
  family_name?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  sub?: string;
  id?: string;
  [key: string]: any;
}

const SimpleLinkedInConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [showPageSelector, setShowPageSelector] = useState(false);
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  // Wait for user to be loaded before proceeding with connection checks or OAuth flows
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> Initializing LinkedIn Connection...
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
        .from('user_linkedin_credentials')
        .select('access_token, linkedin_profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.access_token) {
        setIsConnected(true);
        const profile = data.linkedin_profile_data as LinkedInProfileData;
        if (profile) {
          const name = profile.name || 
                      (profile.given_name && profile.family_name ? 
                       `${profile.given_name} ${profile.family_name}` : 
                       profile.localizedFirstName ? 
                       `${profile.localizedFirstName} ${profile.localizedLastName || ''}` : 
                       'LinkedIn User');
          setProfileName(name);
        }
      }
    } catch (error) {
      console.error('Error checking LinkedIn connection:', error);
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
      const savedState = sessionStorage.getItem('linkedin_state');

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

      if (code && state && savedState && state === savedState && user?.id) {
        setConnecting(true);
        try {
          sessionStorage.removeItem('linkedin_state');

          const { data, error } = await supabase.functions.invoke('linkedin-oauth-simple', {
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
              title: "LinkedIn Connected",
              description: "Your LinkedIn account has been successfully connected",
            });

            // Show page selector if needed
            if (data.needsPageSelection) {
              setShowPageSelector(true);
            }

            window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
              detail: { platform: 'linkedin', connected: true }
            }));
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

      const state = generateRandomString();
      sessionStorage.setItem('linkedin_state', state);

      // Get the proper OAuth URL from our centralized endpoint
      const { data, error } = await supabase.functions.invoke('get-linkedin-auth-url', {
        body: { state }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to generate LinkedIn authorization URL');
      }

      window.location.href = data.authUrl;
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

      const { error } = await supabase
        .from('user_linkedin_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Also delete LinkedIn pages
      await supabase
        .from('user_linkedin_pages')
        .delete()
        .eq('user_id', user.id);

      setIsConnected(false);
      setProfileName('');

      toast({
        title: "LinkedIn Disconnected",
        description: "Your LinkedIn account has been disconnected",
      });

      window.dispatchEvent(new CustomEvent('socialConnectionChanged', {
        detail: { platform: 'linkedin', connected: false }
      }));
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
        <AlertTitle className="text-blue-800">Connecting to LinkedIn</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finalizing your LinkedIn connection...
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
            <AlertTitle className="text-green-800">LinkedIn Connected</AlertTitle>
            <AlertDescription>
              Connected as {profileName || 'LinkedIn User'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">LinkedIn</h3>
                <p className="text-sm text-muted-foreground">{profileName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPageSelector(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Settings className="w-4 h-4 mr-1" />
                Manage Pages
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-700 hover:border-red-200"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center space-y-4 p-6 border rounded-lg">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect your LinkedIn</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share your content directly to LinkedIn with one click
            </p>
          </div>
          <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
            Connect LinkedIn
          </Button>
        </div>
      )}

      <LinkedInPageSelector 
        isOpen={showPageSelector}
        onClose={() => setShowPageSelector(false)}
        onSave={() => {
          setShowPageSelector(false);
          toast({
            title: "Pages Updated",
            description: "Your LinkedIn page selection has been saved",
          });
        }}
      />
    </div>
  );
};

export default SimpleLinkedInConnection;
