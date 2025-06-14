
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '../contexts/AuthContext';

const LinkedInConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleConnect = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would validate the API key with LinkedIn API
    // For this demo, we'll just simulate a successful connection
    
    setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn account has been successfully connected",
      });
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey('');
    toast({
      title: "LinkedIn Disconnected",
      description: "Your LinkedIn account has been disconnected",
    });
  };
  
  // For demo purposes, if user logged in via LinkedIn, show as connected
  React.useEffect(() => {
    if (user?.linkedInConnected) {
      setIsConnected(true);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {isConnected ? (
        <>
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertTitle className="text-green-800">LinkedIn Connected</AlertTitle>
            <AlertDescription>
              Your LinkedIn account is successfully connected to Writlix.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">LinkedIn</h3>
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
          
          <div className="border-t pt-6 mt-6">
            <h3 className="font-medium mb-4">LinkedIn Settings</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Post Visibility</Label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                  <option>Public - Anyone on LinkedIn</option>
                  <option>Connections only</option>
                </select>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked />
                  <span>Enable post hashtags</span>
                </Label>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span>Include link to original content</span>
                </Label>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">
            To connect your LinkedIn account, please enter your API key below. You can find 
            your LinkedIn API key in your LinkedIn Developer account.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">LinkedIn API Key</Label>
            <Input
              id="api-key"
              placeholder="Enter your LinkedIn API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          
          <Button onClick={handleConnect}>Connect LinkedIn</Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            By connecting your LinkedIn account, you authorize Writlix to post content on your behalf.
            You can revoke this access at any time.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkedInConnect;
