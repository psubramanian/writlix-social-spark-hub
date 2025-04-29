
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ProfileComplete = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update user profile in the database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          avatar_url: user.avatar,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully completed.",
      });
      
      // Reload the page to refresh auth context with new profile data
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Profile Update Failed",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // If user is fully authenticated and has complete profile, redirect to dashboard
  if (!authLoading && user?.profileComplete) {
    navigate('/dashboard', { replace: true });
    return null;
  }
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-writlix-lightblue bg-opacity-30">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-writlix-lightblue bg-opacity-30">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="bg-writlix-blue rounded-md p-1">
              <span className="font-bold text-white text-2xl">W</span>
            </div>
            <h1 className="text-3xl font-bold">Writlix</h1>
          </div>
          <p className="mt-2 text-muted-foreground">Complete your profile</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Writlix</CardTitle>
            <CardDescription>
              Please complete your profile to continue
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                We'll use this information to personalize your experience
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileComplete;
