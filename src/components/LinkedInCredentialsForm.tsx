
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

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
      const { data, error } = await supabase
        .from('user_linkedin_credentials')
        .select('client_id, client_secret')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClientId(data.client_id);
        setClientSecret(data.client_secret);
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
      const credentials = {
        user_id: user?.id,
        client_id: clientId,
        client_secret: clientSecret,
      };

      const operation = hasCredentials ? 'update' : 'insert';
      
      let query = supabase.from('user_linkedin_credentials');
      
      if (operation === 'update') {
        query = query.update(credentials).eq('user_id', user?.id);
      } else {
        query = query.insert(credentials);
      }

      const { error } = await query;
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `LinkedIn credentials ${operation}d successfully.`,
      });
      
      setHasCredentials(true);
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

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (hasCredentials ? 'Update Credentials' : 'Save Credentials')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LinkedInCredentialsForm;
