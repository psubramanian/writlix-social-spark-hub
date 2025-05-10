
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const InstagramCredentialsForm = () => {
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
      
      console.log('Fetching Instagram credentials for user ID:', user.id);

      const { data, error } = await supabase
        .from('user_instagram_credentials')
        .select('client_id, client_secret')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Instagram credentials:', error);
        return;
      }

      if (data && typeof data === 'object' && 'client_id' in data) {
        console.log('Found Instagram credentials', { hasClientId: !!data.client_id });
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setHasCredentials(true);
      } else {
        console.log('No Instagram credentials found');
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

      if (hasCredentials) {
        // For update operation
        const credentials: TablesUpdate<'user_instagram_credentials'> = {
          client_id: clientId,
          client_secret: clientSecret,
        };
        
        const { error: updateError } = await supabase
          .from('user_instagram_credentials')
          .update(credentials)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // For insert operation
        const credentials: TablesInsert<'user_instagram_credentials'> = {
          user_id: user.id,
          client_id: clientId,
          client_secret: clientSecret,
        };
        
        const { error: insertError } = await supabase
          .from('user_instagram_credentials')
          .insert(credentials);
        
        if (insertError) throw insertError;
      }

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
          <br />
          <span>
            <strong>Redirect URI:</strong>
            <code style={{ marginLeft: 8 }}>
              {typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}
            </code>
            <br />
            <span className="text-xs text-muted-foreground">
              Copy this URI into your Instagram app settings under "Valid OAuth Redirect URIs".
            </span>
          </span>
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

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (hasCredentials ? 'Update Credentials' : 'Save Credentials')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InstagramCredentialsForm;
