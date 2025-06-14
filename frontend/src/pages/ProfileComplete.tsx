import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser and useClerk
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define a type for publicMetadata that includes profileComplete
interface UserPublicMetadataWithProfile extends Record<string, unknown> {
  profileComplete?: boolean;
}

// Type guard to check for profileComplete in publicMetadata
function userHasCompletedProfile(user: { publicMetadata: Record<string, unknown> | null } | null | undefined): boolean {
  return !!(user && user.publicMetadata && typeof (user.publicMetadata as UserPublicMetadataWithProfile).profileComplete === 'boolean' && (user.publicMetadata as UserPublicMetadataWithProfile).profileComplete);
}

const ProfileComplete = () => {
  const { user, isLoaded: clerkIsLoaded } = useUser();
  const { signOut } = useClerk(); // For potential session management if needed, e.g. sign out on critical error
  const authLoading = !clerkIsLoaded;
  // refreshUserProfile is no longer directly available from Clerk's useUser in the same way.
  // Clerk's user object updates automatically. If a forced reload is needed, user.reload() can be called.
  // For now, we'll remove direct calls to refreshUserProfile and rely on automatic updates.
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || user?.firstName || ''); // Ensured correct Clerk properties
  const [error, setError] = useState<string | null>(null);
  const [skipAttempted, setSkipAttempted] = useState(false);
  
  // On component mount, reset the bypass attempts counter to prevent loops
  useEffect(() => {
    localStorage.removeItem('profile_bypass_attempts');
  }, []);
  
  useEffect(() => {
    // Initialize with user name if available and it changes
    if (user && (user.fullName || user.firstName) && (user.fullName || user.firstName) !== fullName) {
      setFullName(user.fullName || user.firstName || '');
    }
  }, [user?.fullName, user?.firstName]); // Corrected dependency array for Clerk user name properties
  
  // Check if user has attempted to complete profile before
  useEffect(() => {
    const hasSkippedBefore = localStorage.getItem('profile_skip_attempted') === 'true';
    if (hasSkippedBefore) {
      setSkipAttempted(true);
    }
  }, []);

  // Check if user is already redirected to dashboard when profile is complete
  useEffect(() => {
    // If user already has a complete profile, redirect to dashboard
    if (!authLoading && userHasCompletedProfile(user)) {
      console.log("[PROFILE] User has completed profile, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user?.publicMetadata?.profileComplete, authLoading, navigate, user]); // Explicitly depend on the boolean value and the user object
  
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
              email: user.primaryEmailAddress?.emailAddress,
              avatar_url: user.imageUrl,
              profile_completed: true, // Explicitly mark as complete
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
      
      // Set local flag to indicate profile has been completed
      localStorage.setItem('profile_completed', 'true');
      localStorage.removeItem('profile_skip_attempted');
      localStorage.removeItem('profile_bypass_attempts');
      
      // Refresh user profile to reflect changes
      // await refreshUserProfile(); // Removed, Clerk user object updates automatically
      // Potentially call user.reload() here if an immediate forced refresh of Clerk's user data is critical
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully completed.",
      });
      
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.message || "There was a problem updating your profile.");
      
      // Even if we couldn't update the profile, set the local flag
      // to prevent infinite profile completion loops
      localStorage.setItem('profile_completed', 'true');
      localStorage.removeItem('profile_skip_attempted');
      localStorage.removeItem('profile_bypass_attempts');
      
      toast({
        title: "Profile Update Failed",
        description: "We couldn't update your profile, but you can continue using the app.",
        variant: "destructive",
      });
      
      // Redirect to dashboard anyway after showing error
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle skip for now
  const handleSkip = () => {
    console.log("[PROFILE] User chose to skip profile completion");
    localStorage.setItem('profile_skip_attempted', 'true');
    localStorage.removeItem('profile_bypass_attempts');
    
    // Even if skipping, try to update the profile with profile_completed=true
    if (user?.id) {
      supabase
        .from('profiles')
        .update({ 
          profile_completed: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.warn("[PROFILE] Failed to mark profile as complete on skip:", error);
          } else {
            console.log("[PROFILE] Successfully marked profile as complete on skip");
          }
        });
    }
    
    toast({
      title: "Profile Completion Skipped",
      description: "You can complete your profile later from the settings page.",
    });
    
    // Refresh user profile to reflect changes
    // refreshUserProfile().then(...); // Removed
    // Assuming profile_completed status is now part of Clerk's user.publicMetadata
    // If not immediately reflected, a user.reload() might be considered here before navigating.
    // For now, relying on Clerk's automatic updates.
    navigate('/dashboard', { replace: true });
  };
  
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
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-black/80 text-xs text-white rounded">
            <div>Auth ID: {user?.id || 'None'}</div>
            <div>Profile state: {userHasCompletedProfile(user) ? 'Complete' : 'Incomplete'}</div>
            <div>LS Skip: {localStorage.getItem('profile_skip_attempted') || 'false'}</div>
            <div>LS Complete: {localStorage.getItem('profile_completed') || 'false'}</div>
            <div>LS Bypass Attempts: {localStorage.getItem('profile_bypass_attempts') || '0'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComplete;
