import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser
import { HelpCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { credentialsOperations } from '@/utils/supabaseHelpers';

function isInstagramCredentialData(
  obj: any
): obj is {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token?: string;
  instagram_profile_data?: any;
} {
  return (
    obj &&
    typeof obj === "object" &&
    "client_id" in obj &&
    "client_secret" in obj &&
    "redirect_uri" in obj
  );
}

const InstagramCredentialsForm = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [loading, setLoading] = useState(false); // This is for submit loading, not initial data load
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();
  const { user, isLoaded } = useUser(); // Moved useUser here to be before the initial !isLoaded check
  const defaultRedirectUri = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "";

  if (!isLoaded) { // Initial Clerk loading state
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instagram API Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Initializing...
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchCredentials();
    } else if (isLoaded && !user?.id) {
        setClientId('');
        setClientSecret('');
        setRedirectUri(defaultRedirectUri);
        setHasCredentials(false);
        toast({
            title: "User not found",
            description: "Please log in to manage Instagram credentials.",
            variant: "destructive",
        });
    }
  }, [user?.id, isLoaded, toast, defaultRedirectUri]); // `fetchCredentials` is defined in scope, its dependencies are covered.

  const fetchCredentials = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available for fetching credentials');
        return;
      }

      console.log('Fetching Instagram credentials for user ID:', user.id);

      const data = await credentialsOperations.instagram.fetch(user.id);

      if (isInstagramCredentialData(data)) {
        console.log('Found Instagram credentials', { hasClientId: !!data.client_id });
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setRedirectUri(data.redirect_uri || defaultRedirectUri);
        setHasCredentials(true);
      } else {
        console.log('No Instagram credentials found');
        setRedirectUri(defaultRedirectUri);
      }
    } catch (error) {
      console.error('Error fetching Instagram credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await credentialsOperations.instagram.upsert(
        user.id,
        {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
        hasCredentials
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Instagram credentials ${hasCredentials ? 'updated' : 'saved'} successfully.`,
      });

      setHasCredentials(true);
      toast({
        title: "Next Step",
        description: "Now click 'Connect Instagram Account' below to authorize Writlix with Instagram.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Instagram credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram API Credentials</CardTitle>
        <CardDescription>
          Enter your Instagram API credentials to enable posting to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">App ID</Label>
            <Input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Instagram App ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">App Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your Instagram App Secret"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={16} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>This is the URL where Instagram will redirect after authentication. It must match exactly what you configured in your Instagram app settings.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="redirectUri"
              type="text"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder={defaultRedirectUri}
            />
            <p className="text-xs text-muted-foreground">
              Copy this URI into your Instagram app settings under "Valid OAuth Redirect URIs".
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (hasCredentials ? 'Update Credentials' : 'Save Credentials')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InstagramCredentialsForm;
