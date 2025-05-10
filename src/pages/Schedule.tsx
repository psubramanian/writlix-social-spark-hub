
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulePostForm from '../components/SchedulePostForm';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useToast } from '@/components/ui/use-toast';
import { CurrentScheduleCard } from '@/components/schedule/CurrentScheduleCard';
import { ScheduledPostsList } from '@/components/schedule/ScheduledPostsList';
import { usePostOperations } from '@/hooks/usePostOperations';
import { LinkedInWarning } from '@/components/dashboard/LinkedInWarning';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Add type definition for scheduled posts that's consistent with our components
interface ScheduledPostDisplay {
  id: string;
  content_ideas?: {
    title: string;
    status: string;
  };
  next_run_at: string;
  timezone: string;
}

interface SocialConnectionStatus {
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
}

const Schedule = () => {
  const navigate = useNavigate();
  const { posts, loading: postsLoading, userSettings, fetchPosts } = useScheduledPosts();
  const { postToLinkedIn, postToFacebook, postToInstagram } = usePostOperations();
  const [postingId, setPostingId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
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
  }, [user]);

  const scheduledPosts = posts.filter(post => post.content_ideas?.status !== 'Published');

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

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">Plan and manage your social media posts</p>
      </div>
      
      <Tabs defaultValue="scheduled">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="scheduled" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
              <CurrentScheduleCard settings={userSettings} />
              <SchedulePostForm 
                onSchedule={handleScheduleSubmit} 
                initialValues={userSettings}
                isUpdating={isUpdating}
              />
            </div>
            
            <div className="lg:col-span-1">
              {!checkingConnection && !socialConnections.linkedin && 
               !socialConnections.facebook && !socialConnections.instagram && (
                <LinkedInWarning onClick={handleConnectSocial} />
              )}
              <ScheduledPostsList
                posts={scheduledPosts}
                postingId={postingId}
                onPostNow={handlePostNow}
                loading={postsLoading}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
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
