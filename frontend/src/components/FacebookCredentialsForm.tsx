import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser
import { HelpCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { credentialsOperations } from '@/utils/supabaseHelpers';

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

const FacebookCredentialsForm = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();
  const { user, isLoaded } = useUser(); // Replaced useAuth with Clerk's useUser
  const authLoading = !isLoaded;
  const defaultRedirectUri = typeof window !== "undefined" ? 
    window.location.origin + window.location.pathname : "";

  useEffect(() => {
    if (isLoaded && user?.id) { // Check isLoaded before fetching
      fetchCredentials();
    } else if (isLoaded && !user) {
      toast({
        title: "Authentication Error",
        description: "User not found. Cannot fetch credentials.",
        variant: "destructive",
      });
    }
  }, [user?.id, isLoaded, toast]); // Added isLoaded and toast to dependencies

  const fetchCredentials = async () => {
    // user and user.id are now checked in useEffect before calling this
    if (!user?.id) { // This check is now more of a safeguard
      console.error('Fetch credentials called without user ID');
      toast({
        title: "Error",
        description: "Cannot fetch credentials without a user.",
        variant: "destructive",
      });
      return;
    }
    try {
      console.log('Fetching Facebook credentials for user ID:', user.id);

      const data = await credentialsOperations.facebook.fetch(user.id);

      if (isFacebookCredentialData(data)) {
        console.log('Found Facebook credentials', { hasClientId: !!data.client_id });
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setRedirectUri(data.redirect_uri || defaultRedirectUri);
        setHasCredentials(true);
      } else {
        console.log('No Facebook credentials found');
        setRedirectUri(defaultRedirectUri);
      }
    } catch (error) {
      console.error('Error fetching Facebook credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLoaded || !user?.id) { // Check isLoaded and user before submitting
      toast({
        title: "Authentication Error",
        description: "User not available. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {

      const { error } = await credentialsOperations.facebook.upsert(
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
        description: `Facebook credentials ${hasCredentials ? 'updated' : 'saved'} successfully.`,
      });
      
      setHasCredentials(true);
      toast({
        title: "Next Step",
        description: "Now click 'Connect Facebook Account' below to authorize Writlix with Facebook.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Facebook credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading Facebook credentials...</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook API Credentials</CardTitle>
        <CardDescription>
          Enter your Facebook API credentials to enable posting to your account
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
              placeholder="Enter your Facebook App ID"
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
              placeholder="Enter your Facebook App Secret"
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
                    <p>This is the URL where Facebook will redirect after authentication. It must match exactly what you configured in your Facebook app settings.</p>
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
              Copy this URI into your Facebook app settings under "Valid OAuth Redirect URIs".
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

export default FacebookCredentialsForm;
