import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/auth';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { credentialsOperations } from '@/utils/supabaseHelpers';

function isLinkedInCredentialData(
  obj: any
): obj is {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token?: string;
  linkedin_profile_data?: any;
} {
  return (
    obj &&
    typeof obj === "object" &&
    "client_id" in obj &&
    "client_secret" in obj &&
    "redirect_uri" in obj
  );
}

const LinkedInCredentialsForm = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const defaultRedirectUri = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "";

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available for fetching credentials');
        return;
      }

      console.log('Fetching LinkedIn credentials for user ID:', user.id);

      const data = await credentialsOperations.linkedin.fetch(user.id);

      if (isLinkedInCredentialData(data)) {
        console.log('Found LinkedIn credentials', { hasClientId: !!data.client_id });
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setRedirectUri(data.redirect_uri || defaultRedirectUri);
        setHasCredentials(true);
      } else {
        console.log('No LinkedIn credentials found');
        setRedirectUri(defaultRedirectUri);
      }
    } catch (error) {
      console.error('Error fetching LinkedIn credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await credentialsOperations.linkedin.upsert(
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
        description: `LinkedIn credentials ${hasCredentials ? 'updated' : 'saved'} successfully.`,
      });

      setHasCredentials(true);
      toast({
        title: "Next Step",
        description: "Now click 'Connect LinkedIn Account' below to authorize Writlix with LinkedIn.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save LinkedIn credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LinkedIn API Credentials</CardTitle>
        <CardDescription>
          Enter your LinkedIn API credentials to enable posting to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your LinkedIn Client ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your LinkedIn Client Secret"
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
                    <p>This is the URL where LinkedIn will redirect after authentication. It must match exactly what you configured in your LinkedIn app settings.</p>
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
              Copy this URI into your LinkedIn app settings under "Authorized Redirect URLs".
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

export default LinkedInCredentialsForm;
