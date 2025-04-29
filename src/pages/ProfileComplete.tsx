
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProfileComplete = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [skipAttempted, setSkipAttempted] = useState(false);
  
  // Check if user has attempted to complete profile before
  useEffect(() => {
    const hasSkippedBefore = localStorage.getItem('profile_skip_attempted') === 'true';
    if (hasSkippedBefore) {
      setSkipAttempted(true);
    }
  }, []);

  // If user already skipped once and has a name, auto-redirect to dashboard
  useEffect(() => {
    if (skipAttempted && user?.name) {
      console.log("[PROFILE] User previously skipped profile completion and has a name, auto-redirecting");
      navigate('/dashboard', { replace: true });
    }
  }, [skipAttempted, user, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Make multiple attempts to update the profile
      let attempts = 0;
      let success = false;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`[PROFILE] Attempt ${attempts} to update profile`);
        
        try {
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
          
          success = true;
          
        } catch (attemptError) {
          console.warn(`[PROFILE] Profile update attempt ${attempts} failed:`, attemptError);
          
          if (attempts >= maxAttempts) {
            throw attemptError;
          }
          
          // Wait a bit before trying again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully completed.",
      });
      
      // Set local flag to indicate profile has been completed
      localStorage.setItem('profile_completed', 'true');
      
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.message || "There was a problem updating your profile.");
      toast({
        title: "Profile Update Failed",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle skip for now
  const handleSkip = () => {
    console.log("[PROFILE] User chose to skip profile completion");
    localStorage.setItem('profile_skip_attempted', 'true');
    toast({
      title: "Profile Completion Skipped",
      description: "You can complete your profile later from the settings page.",
    });
    navigate('/dashboard', { replace: true });
  };
  
  // If user is fully authenticated and has complete profile, redirect to dashboard
  if (!authLoading && user?.profileComplete) {
    console.log("[PROFILE] User has completed profile, redirecting to dashboard");
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
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
            
            <CardFooter className="flex flex-col space-y-2">
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
              
              <Button 
                type="button" 
                variant="ghost" 
                className="text-muted-foreground"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileComplete;
