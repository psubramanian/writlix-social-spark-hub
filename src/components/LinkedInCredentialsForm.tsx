
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

const LinkedInCredentialsForm = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available for fetching credentials');
        return;
      }

      const { data, error } = await supabase
        .from('user_linkedin_credentials')
        .select('client_id, client_secret')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching LinkedIn credentials:', error);
        return;
      }

      if (data) {
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setHasCredentials(true);
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

      // Properly type the credentials data to match what Supabase expects
      const credentials: Partial<Tables<'user_linkedin_credentials'>> = {
        user_id: user.id,
        client_id: clientId,
        client_secret: clientSecret,
      };

      let error;
      
      if (hasCredentials) {
        // For update operation
        const { error: updateError } = await supabase
          .from('user_linkedin_credentials')
          .update(credentials)
          .eq('user_id', user.id);
        
        error = updateError;
      } else {
        // For insert operation
        const { error: insertError } = await supabase
          .from('user_linkedin_credentials')
          .insert(credentials as Tables<'user_linkedin_credentials'>);
        
        error = insertError;
      }
      
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
          <br />
          <span>
            <strong>Redirect URI:</strong>
            <code style={{ marginLeft: 8 }}>
              {typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}
            </code>
            <br />
            <span className="text-xs text-muted-foreground">
              Copy this URI into your LinkedIn app settings under "Authorized Redirect URLs".
            </span>
          </span>
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

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (hasCredentials ? 'Update Credentials' : 'Save Credentials')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LinkedInCredentialsForm;
