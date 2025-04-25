
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LinkedInConnect from '../components/LinkedInConnect';
import LinkedInCredentialsForm from '../components/LinkedInCredentialsForm';

const Settings = () => {
  return (
    <div className="flex h-screen bg-writlix-lightgray">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and connections</p>
          </div>
          
          <Tabs defaultValue="connections">
            <TabsList className="mb-6">
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connections" className="mt-0 space-y-6">
              <LinkedInCredentialsForm />
              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn Connection</CardTitle>
                  <CardDescription>Connect your LinkedIn account to enable post scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <LinkedInConnect />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Account settings will be available in a future update.
                  </p>
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
        </main>
      </div>
    </div>
  );
};

export default Settings;
