
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LinkedInOAuth from '../components/LinkedInOAuth';
import FacebookOAuth from '../components/FacebookOAuth';
import InstagramOAuth from '../components/InstagramOAuth';
import LinkedInCredentialsForm from '../components/LinkedInCredentialsForm';
import FacebookCredentialsForm from '../components/FacebookCredentialsForm';
import InstagramCredentialsForm from '../components/InstagramCredentialsForm';
import { AccountSettingsForm } from '../components/AccountSettingsForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const { isLoading: authLoading, user } = useAuth();
  
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
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      ) : user ? (
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
            {/* LinkedIn Connection */}
            <LinkedInCredentialsForm />
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Connection</CardTitle>
                <CardDescription>Connect your LinkedIn account to enable post scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <LinkedInOAuth />
              </CardContent>
            </Card>
            
            {/* Facebook Connection */}
            <FacebookCredentialsForm />
            <Card>
              <CardHeader>
                <CardTitle>Facebook Connection</CardTitle>
                <CardDescription>Connect your Facebook account to enable post scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <FacebookOAuth />
              </CardContent>
            </Card>
            
            {/* Instagram Connection */}
            <InstagramCredentialsForm />
            <Card>
              <CardHeader>
                <CardTitle>Instagram Connection</CardTitle>
                <CardDescription>Connect your Instagram account to enable post scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <InstagramOAuth />
              </CardContent>
            </Card>
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Could not load user data. Please try logging out and back in.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
};

export default Settings;
