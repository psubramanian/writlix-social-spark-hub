
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleLinkedInConnection from '../components/social/SimpleLinkedInConnection';
import SimpleFacebookConnection from '../components/social/SimpleFacebookConnection';
import SimpleInstagramConnection from '../components/social/SimpleInstagramConnection';
import { AccountSettingsForm } from '../components/AccountSettingsForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const { user, isLoaded } = useUser();
  const authLoading = !isLoaded;
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['account', 'connections', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/settings?tab=${value}`, { replace: true });
  };
  
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and connections</p>
      </div>
      
      {authLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading settings...
        </div>
      ) : isLoaded && !user ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Could not load user data. Please try logging out and back in.
          </AlertDescription>
        </Alert>
      ) : isLoaded && user ? (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <AccountSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="mt-0 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn</CardTitle>
                  <CardDescription>Connect your LinkedIn account for professional networking</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLinkedInConnection />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Facebook</CardTitle>
                  <CardDescription>Connect your Facebook account for social sharing</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleFacebookConnection />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Instagram</CardTitle>
                  <CardDescription>Connect your Instagram account for visual content</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleInstagramConnection />
                </CardContent>
              </Card>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Seamless Integration</AlertTitle>
              <AlertDescription className="text-blue-700">
                Connect your social media accounts with just one click. No API keys or complex setup required!
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Customize how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Status Unknown</AlertTitle>
          <AlertDescription>
            Cannot determine authentication status.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
};

export default Settings;
