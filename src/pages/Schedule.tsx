import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator"; 
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, LayoutList } from "lucide-react";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useToast } from '@/components/ui/use-toast';
import { CurrentScheduleCard } from '@/components/schedule/CurrentScheduleCard';
import { ScheduledPostsList } from '@/components/schedule/ScheduledPostsList';
import { ScheduledPostsCalendar } from '@/components/schedule/ScheduledPostsCalendar';
import { usePostOperations } from '@/hooks/usePostOperations';
import { LinkedInWarning } from '@/components/dashboard/LinkedInWarning';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SocialConnectionStatus {
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
}

type ViewMode = 'list' | 'calendar';

const Schedule = () => {
  const navigate = useNavigate();
  const { 
    posts, 
    groupedPosts,
    loading: postsLoading, 
    userSettings, 
    fetchPosts,
    formatScheduleDate,
    getSchedulePattern,
    getPostsForDate
  } = useScheduledPosts();
  
  const { postToLinkedIn, postToFacebook, postToInstagram } = usePostOperations();
  const [postingId, setPostingId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [socialConnections, setSocialConnections] = useState<SocialConnectionStatus>({
    linkedin: false,
    facebook: false,
    instagram: false
  });
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateUserSettings, isUpdating } = useScheduleSettings();

  // Debug logging
  console.log('Schedule page - View mode:', viewMode);
  console.log('Schedule page - Posts available:', posts.length);
  console.log('Schedule page - User timezone:', userSettings?.timezone);

  useEffect(() => {
    const checkSocialConnections = async () => {
      if (!user) {
        setCheckingConnection(false);
        return;
      }

      try {
        // Check LinkedIn
        const { data: linkedInData, error: linkedInError } = await supabase
          .from('user_linkedin_credentials')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!linkedInError) {
          setSocialConnections(prev => ({
            ...prev,
            linkedin: !!linkedInData?.access_token
          }));
        }
        
        // Check Facebook
        const { data: facebookData, error: facebookError } = await supabase
          .from('user_facebook_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!facebookError) {
          setSocialConnections(prev => ({
            ...prev,
            facebook: !!(facebookData?.access_token || facebookData?.long_lived_token)
          }));
        }
        
        // Check Instagram
        const { data: instagramData, error: instagramError } = await supabase
          .from('user_instagram_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!instagramError) {
          setSocialConnections(prev => ({
            ...prev,
            instagram: !!(instagramData?.access_token || instagramData?.long_lived_token)
          }));
        }
      } catch (error) {
        console.error('Error checking social connections:', error);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    checkSocialConnections();
    
    // Add debug logging for timezone issues
    console.log('Schedule page user timezone:', userSettings?.timezone);
    console.log('Schedule pattern:', schedulePattern);
  }, [user, userSettings]);

  const scheduledPosts = posts.filter(post => post.content_ideas?.status !== 'Published');
  const schedulePattern = userSettings ? getSchedulePattern(userSettings) : undefined;

  const handleScheduleSubmit = async (settings: any) => {
    const success = await updateUserSettings(settings);
    if (success) {
      await fetchPosts();
    }
  };

  const handlePostNow = async (postId: string, platform: string, imgUrl?: string) => {
    // For Instagram posts, we need an image URL
    if (platform === 'instagram' && !imgUrl) {
      setCurrentPostId(postId);
      setInstagramDialogOpen(true);
      return;
    }
    
    // Check if the selected platform is connected
    if (!socialConnections[platform as keyof SocialConnectionStatus]) {
      toast({
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} not connected`,
        description: `Please connect your ${platform} account in Settings first.`,
        variant: "destructive",
      });
      return;
    }
    
    setPostingId(postId);
    setActivePlatform(platform);
    
    try {
      toast({
        title: `Posting to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
        description: `Sending your content to ${platform}...`,
      });
      
      let result;
      
      switch (platform) {
        case 'linkedin':
          result = await postToLinkedIn(postId);
          break;
        case 'facebook':
          result = await postToFacebook(postId);
          break;
        case 'instagram':
          if (!imgUrl) {
            throw new Error("Instagram requires an image URL");
          }
          result = await postToInstagram(postId, imgUrl);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      if (result) {
        toast({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post Sent`,
          description: `Your content has been posted to ${platform} successfully.`,
        });
      }
    } catch (error: any) {
      console.error(`Error in ${platform} post handler:`, error);
      
      const errorMessage = error.message || `There was an error posting to ${platform}`;
      
      toast({
        title: "Post Failed",
        description: errorMessage.includes(platform) ? errorMessage : `Failed to post to ${platform}. Please check your connection.`,
        variant: "destructive",
      });
    } finally {
      setPostingId(null);
      setActivePlatform(null);
    }
  };
  
  const handleInstagramDialogSubmit = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Image URL Required",
        description: "Please provide a valid image URL for Instagram posts.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentPostId) {
      handlePostNow(currentPostId, 'instagram', imageUrl);
      setInstagramDialogOpen(false);
      setCurrentPostId(null);
    }
  };
  
  const handleConnectSocial = () => {
    navigate('/settings?tab=connections');
  };

  // Check for past posts
  const hasPastPosts = groupedPosts.past && groupedPosts.past.length > 0;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">Plan and manage your social media posts</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Past Due Posts Alert */}
        {hasPastPosts && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Past Due Posts</AlertTitle>
            <AlertDescription>
              You have {groupedPosts.past.length} post{groupedPosts.past.length !== 1 ? 's' : ''} with dates in the past.
              These posts have not been published. You can post them manually or update your schedule settings.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Schedule Settings Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Schedule Settings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CurrentScheduleCard settings={userSettings} />
            </div>
            <div>
              <SchedulePostForm 
                onSchedule={handleScheduleSubmit} 
                initialValues={userSettings}
                isUpdating={isUpdating}
              />
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Scheduled Posts Section with View Toggle */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Scheduled Posts</h2>
            
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
              <ToggleGroupItem value="list" aria-label="List View">
                <LayoutList className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">List</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar View">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Calendar</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {!checkingConnection && !socialConnections.linkedin && 
           !socialConnections.facebook && !socialConnections.instagram && (
            <div className="mb-6">
              <LinkedInWarning onClick={handleConnectSocial} />
            </div>
          )}
          
          {viewMode === 'list' ? (
            <ScheduledPostsList
              posts={posts}
              groupedPosts={groupedPosts}
              postingId={postingId}
              onPostNow={handlePostNow}
              loading={postsLoading}
              formatScheduleDate={formatScheduleDate}
              schedulePattern={userSettings ? getSchedulePattern(userSettings) : undefined}
              userTimezone={userSettings?.timezone}
            />
          ) : (
            <ScheduledPostsCalendar
              posts={posts}
              groupedPosts={groupedPosts}
              postingId={postingId}
              onPostNow={handlePostNow}
              loading={postsLoading}
              formatScheduleDate={formatScheduleDate}
              userTimezone={userSettings?.timezone}
            />
          )}
        </div>
      </div>
      
      {/* Dialog for Instagram image URL input */}
      <Dialog open={instagramDialogOpen} onOpenChange={setInstagramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instagram Image Required</DialogTitle>
            <DialogDescription>
              Instagram requires an image to create a post. Please provide a URL to an image.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstagramDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstagramDialogSubmit}>
              Post to Instagram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Schedule;
