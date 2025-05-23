
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useInstantPost } from '../hooks/useInstantPost';
import { Loader2, ImageIcon, Upload, AlertCircle } from "lucide-react";
import RichTextEditor from '../components/RichTextEditor';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [imageUrl, setImageUrl] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    generateContentFromImage, 
    postToLinkedIn, 
    postToFacebook, 
    postToInstagram,
    isGenerating, 
    isPosting,
    postingPlatform
  } = useInstantPost();

  // Check social connections when component mounts
  useState(() => {
    const checkSocialConnections = async () => {
      if (!user) return;
      
      try {
        // Check LinkedIn
        const { data: linkedInData } = await supabase
          .from('user_linkedin_credentials')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        setSocialConnections(prev => ({
          ...prev,
          linkedin: !!linkedInData?.access_token
        }));
        
        // Check Facebook
        const { data: facebookData } = await supabase
          .from('user_facebook_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        setSocialConnections(prev => ({
          ...prev,
          facebook: !!(facebookData?.access_token || facebookData?.long_lived_token)
        }));
        
        // Check Instagram
        const { data: instagramData } = await supabase
          .from('user_instagram_credentials')
          .select('access_token, long_lived_token')
          .eq('user_id', user.id)
          .maybeSingle();
          
        setSocialConnections(prev => ({
          ...prev,
          instagram: !!(instagramData?.access_token || instagramData?.long_lived_token)
        }));
      } catch (error) {
        console.error('Error checking social connections:', error);
      }
    };
    
    checkSocialConnections();
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDropError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setDropError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setDropError('Only image files are accepted.');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clean up the preview URL when component unmounts
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
      
      // Create plain text version by removing HTML tags
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

  const handlePost = async () => {
    if (!contentPlain.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to post.",
        variant: "destructive",
      });
      return;
    }
    
    // For Instagram, we need an image
    if (selectedPlatforms.includes('instagram') && !previewUrl && !imageUrl) {
      setInstagramDialogOpen(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const postPromises = selectedPlatforms.map(platform => {
        switch(platform) {
          case 'linkedin':
            if (!socialConnections.linkedin) {
              throw new Error("LinkedIn account not connected. Please connect your LinkedIn account in Settings.");
            }
            return postToLinkedIn(contentPlain);
          case 'facebook':
            if (!socialConnections.facebook) {
              throw new Error("Facebook account not connected. Please connect your Facebook account in Settings.");
            }
            return postToFacebook(contentPlain);
          case 'instagram':
            if (!socialConnections.instagram) {
              throw new Error("Instagram account not connected. Please connect your Instagram account in Settings.");
            }
            const imgUrl = previewUrl || imageUrl;
            if (!imgUrl) {
              throw new Error("Instagram requires an image. Please upload or provide an image URL.");
            }
            return postToInstagram(contentPlain, imgUrl);
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(postPromises);
      
      toast({
        title: "Posted Successfully",
        description: `Your post has been shared on ${selectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}.`,
      });
      
      // Reset the form
      setContentHtml('');
      setContentPlain('');
      setSelectedImage(null);
      setPreviewUrl(null);
      setImageUrl('');
    } catch (error: any) {
      console.error('Error posting content:', error);
      toast({
        title: "Posting Failed",
        description: error.message || "Failed to post content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    handlePost();
  };
  
  const isDisabled = isGenerating || isPosting || loading;

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
              <label className="block text-sm font-medium">Select platforms</label>
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
                </ToggleGroupItem>
                
                <ToggleGroupItem 
                  value="facebook" 
                  aria-label="Facebook"
                  disabled={!socialConnections.facebook}
                  className="flex gap-2 items-center"
                >
                  <Facebook className="h-4 w-4" />
                  <span>Facebook</span>
                </ToggleGroupItem>
                
                <ToggleGroupItem 
                  value="instagram" 
                  aria-label="Instagram"
                  disabled={!socialConnections.instagram}
                  className="flex gap-2 items-center"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {!socialConnections.linkedin && !socialConnections.facebook && !socialConnections.instagram && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No social accounts connected</AlertTitle>
                <AlertDescription>
                  Please connect at least one social media account in the Settings page before posting.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="pt-4">
              <Button
                onClick={handlePost}
                disabled={!contentPlain.trim() || selectedPlatforms.length === 0 || isDisabled || 
                         (!socialConnections.linkedin && !socialConnections.facebook && !socialConnections.instagram)}
                className="w-full"
              >
                {isPosting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting to {postingPlatform || 'social media'}...
                  </>
                ) : (
                  <>
                    Post Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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

export default InstantPost;
