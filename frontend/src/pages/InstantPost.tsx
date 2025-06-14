import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useInstantPost } from '../hooks/useInstantPost';
import { Loader2, ImageIcon, Upload, AlertCircle } from "lucide-react";
import RichTextEditor from '../components/RichTextEditor';
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SocialMediaPreviewDialog from '../components/SocialMediaPreviewDialog';
import { credentialsOperations, isValidData } from '@/utils/supabaseHelpers';

interface SocialConnectionStatus {
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
}

// Note: File size limit in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const InstantPost = () => {
  const [contentHtml, setContentHtml] = useState('');
  const [contentPlain, setContentPlain] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('text');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [socialConnections, setSocialConnections] = useState<SocialConnectionStatus>({
    linkedin: false,
    facebook: false,
    instagram: false
  });
  const [loading, setLoading] = useState(false);
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const { toast } = useToast();
  const { user, isLoaded } = useUser(); // Replaced useAuth with Clerk's useUser
  const authLoading = !isLoaded;
  const { 
    generateContentFromImage, 
    postToLinkedIn, 
    postToFacebook, 
    postToInstagram,
    isGenerating, 
    isPosting,
    postingPlatform
  } = useInstantPost(user?.id);

  const checkSocialConnections = useCallback(async () => {
    if (!user?.id) {
      console.log('User not available for social connection check.');
      setSocialConnections({ linkedin: false, facebook: false, instagram: false });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('Checking social connections for user:', user.id);
    
    try {
      const linkedInData = await credentialsOperations.linkedin.fetch(user.id);
      const linkedInConnected = isValidData(linkedInData) && !!(linkedInData as any)?.access_token;
      
      const facebookData = await credentialsOperations.facebook.fetch(user.id);
      const facebookConnected = isValidData(facebookData) && (!!(facebookData as any)?.access_token || !!(facebookData as any)?.long_lived_token);
      
      const instagramData = await credentialsOperations.instagram.fetch(user.id);
      const instagramConnected = isValidData(instagramData) && (!!(instagramData as any)?.access_token || !!(instagramData as any)?.long_lived_token);
      
      setSocialConnections({
        linkedin: linkedInConnected,
        facebook: facebookConnected,
        instagram: instagramConnected
      });
      console.log('Updated social connections state:', { linkedin: linkedInConnected, facebook: facebookConnected, instagram: instagramConnected });
    } catch (error) {
      console.error('Error checking social connections:', error);
      toast({
        title: "Connection Check Failed",
        description: "Failed to check social media connections. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isLoaded, toast]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      checkSocialConnections();
    } else if (isLoaded && !user) {
      console.log('User loaded but not authenticated, clearing social connections.');
      setSocialConnections({ linkedin: false, facebook: false, instagram: false });
      setLoading(false);
    } else if (!isLoaded) {
      // Still loading user information, set loading true to reflect this phase
      console.log('User information is loading, deferring social connection check.');
      setLoading(true); 
    }
  }, [isLoaded, user?.id, checkSocialConnections]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDropError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    if (file.size > MAX_FILE_SIZE) {
      setDropError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setDropError('Only image files are accepted.');
      return;
    }
    
    setSelectedImage(file);
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    return () => URL.revokeObjectURL(objectUrl);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1
  });

  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const content = await generateContentFromImage(selectedImage);
      setContentHtml(content);
      
      const plainText = content.replace(/<[^>]*>?/gm, '');
      setContentPlain(plainText);
      
      setActiveTab('text');
      toast({
        title: "Content Generated",
        description: "Content has been generated from your image.",
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content from image.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewAndPost = () => {
    if (!contentPlain.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to post.",
        variant: "destructive",
      });
      return;
    }
    
    setPreviewDialogOpen(true);
  };

  const handleContentChange = (newContent: string) => {
    setContentPlain(newContent);
    setContentHtml(newContent);
  };

  const handlePostToLinkedIn = async () => {
    try {
      await postToLinkedIn(contentPlain);
      toast({
        title: "Posted to LinkedIn",
        description: "Your post has been shared on LinkedIn.",
      });
      setPreviewDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "LinkedIn Posting Failed",
        description: error.message || "Failed to post to LinkedIn.",
        variant: "destructive",
      });
    }
  };

  const handlePostToFacebook = async () => {
    try {
      await postToFacebook(contentPlain);
      toast({
        title: "Posted to Facebook",
        description: "Your post has been shared on Facebook.",
      });
      setPreviewDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Facebook Posting Failed",
        description: error.message || "Failed to post to Facebook.",
        variant: "destructive",
      });
    }
  };

  const handlePostToInstagram = async () => {
    const imgUrl = previewUrl || imageUrl;
    if (!imgUrl) {
      setInstagramDialogOpen(true);
      return;
    }
    
    try {
      await postToInstagram(contentPlain, imgUrl);
      toast({
        title: "Posted to Instagram",
        description: "Your post has been shared on Instagram.",
      });
      setPreviewDialogOpen(false);
      setInstagramDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Instagram Posting Failed",
        description: error.message || "Failed to post to Instagram.",
        variant: "destructive",
      });
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
    
    setInstagramDialogOpen(false);
    handlePostToInstagram();
  };

  const handleRefreshConnections = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Re-check all social connections
      const [linkedInData, facebookData, instagramData] = await Promise.all([
        credentialsOperations.linkedin.fetch(user.id),
        credentialsOperations.facebook.fetch(user.id),
        credentialsOperations.instagram.fetch(user.id)
      ]);

      setSocialConnections({
        linkedin: isValidData(linkedInData) && !!(linkedInData as any)?.access_token,
        facebook: isValidData(facebookData) && 
          (!!(facebookData as any)?.access_token || !!(facebookData as any)?.long_lived_token),
        instagram: isValidData(instagramData) && 
          (!!(instagramData as any)?.access_token || !!(instagramData as any)?.long_lived_token)
      });

      toast({
        title: "Connections Refreshed",
        description: "Social media connection status has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing connections:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh connection status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContentHtml('');
    setContentPlain('');
    setSelectedImage(null);
    setPreviewUrl(null);
    setImageUrl('');
  };
  
  const isDisabled = authLoading || isGenerating || isPosting || !contentPlain.trim() || loading; 
  const hasAnyConnection = socialConnections.linkedin || socialConnections.facebook || socialConnections.instagram;

  if (authLoading && !user) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your space...</p>
      </div>
    );
  }

  if (isLoaded && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to access this page. Please log in or sign up.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Instant Post</h1>
        <p className="text-muted-foreground">Create and share content instantly across platforms</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Content creation */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Create Content</CardTitle>
            <CardDescription>Write or generate content to post</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="text">Text Editor</TabsTrigger>
                <TabsTrigger value="image">Image Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-0">
                <div className="space-y-4">
                  <RichTextEditor
                    content={contentHtml}
                    onChange={handleContentChange}
                    onContentChange={(html, text) => {
                      setContentHtml(html);
                      setContentPlain(text);
                    }}
                    placeholder="Write your post content here..."
                    disabled={isDisabled}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-0">
                <div className="space-y-4">
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} disabled={isDisabled} />
                    
                    {previewUrl ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-full max-w-xs mx-auto">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="rounded-md max-h-64 max-w-full mx-auto"
                          />
                        </div>
                        <p className="text-sm">Click or drag to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supports JPG, PNG, GIF (Max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {dropError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{dropError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="pt-2">
                    <Button
                      onClick={handleGenerateFromImage}
                      disabled={!selectedImage || isDisabled}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Generate Content from Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Right column - Posting options */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Share Content</CardTitle>
            <CardDescription>Post your content to social media</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Select platforms</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshConnections}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Refresh
                </Button>
              </div>
              <ToggleGroup 
                type="multiple" 
                className="justify-start"
                value={selectedPlatforms}
                onValueChange={value => {
                  if (value.length > 0) {
                    setSelectedPlatforms(value);
                  }
                }}
              >
                <ToggleGroupItem 
                  value="linkedin" 
                  aria-label="LinkedIn"
                  disabled={!socialConnections.linkedin}
                  className="flex gap-2 items-center"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                  {!socialConnections.linkedin && (
                    <span className="text-xs text-muted-foreground">(Not connected)</span>
                  )}
                </ToggleGroupItem>
                
                <ToggleGroupItem 
                  value="facebook" 
                  aria-label="Facebook"
                  disabled={!socialConnections.facebook}
                  className="flex gap-2 items-center"
                >
                  <Facebook className="h-4 w-4" />
                  <span>Facebook</span>
                  {!socialConnections.facebook && (
                    <span className="text-xs text-muted-foreground">(Not connected)</span>
                  )}
                </ToggleGroupItem>
                
                <ToggleGroupItem 
                  value="instagram" 
                  aria-label="Instagram"
                  disabled={!socialConnections.instagram}
                  className="flex gap-2 items-center"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                  {!socialConnections.instagram && (
                    <span className="text-xs text-muted-foreground">(Not connected)</span>
                  )}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {!hasAnyConnection && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No social accounts connected</AlertTitle>
                <AlertDescription>
                  Please connect at least one social media account in the Settings page before posting.
                </AlertDescription>
              </Alert>
            )}
            
            {loading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Checking Connections</AlertTitle>
                <AlertDescription>
                  Verifying your social media connections...
                </AlertDescription>
              </Alert>
            )}
            
            <div className="pt-4">
              <Button
                onClick={handlePreviewAndPost}
                disabled={!contentPlain.trim() || selectedPlatforms.length === 0 || isDisabled || !hasAnyConnection}
                className="w-full"
              >
                Preview & Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Social Media Preview Dialog */}
      <SocialMediaPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        content={contentPlain}
        imageUrl={previewUrl || undefined}
        selectedPlatforms={selectedPlatforms}
        onPostToLinkedIn={handlePostToLinkedIn}
        onPostToFacebook={handlePostToFacebook}
        onPostToInstagram={handlePostToInstagram}
        isPosting={isPosting}
        postingPlatform={postingPlatform}
        onContentChange={handleContentChange}
      />
      
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

export default InstantPost;
