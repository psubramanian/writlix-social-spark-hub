
import { useEffect, useState } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Send, Upload, Sparkles, Loader2 } from 'lucide-react';
import { useInstantPost } from '@/hooks/useInstantPost';
import { useToast } from '@/components/ui/use-toast';

const InstantPost = () => {
  const [userContent, setUserContent] = useState('<p>Write your LinkedIn post here...</p>');
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    generateContentFromImage, 
    postToLinkedIn, 
    isGenerating, 
    isPosting 
  } = useInstantPost();

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Generate content from image
  const handleGenerateContent = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image to generate content",
        variant: "destructive"
      });
      return;
    }

    try {
      const content = await generateContentFromImage(selectedImage);
      setGeneratedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content from image",
        variant: "destructive"
      });
    }
  };

  // Post content to LinkedIn
  const handlePostToLinkedIn = async () => {
    const finalContent = generatedContent || userContent;
    if (!finalContent || finalContent === '<p>Write your LinkedIn post here...</p>') {
      toast({
        title: "Empty content",
        description: "Please write or generate content before posting",
        variant: "destructive"
      });
      return;
    }

    try {
      await postToLinkedIn(finalContent);
      toast({
        title: "Success!",
        description: "Your post has been shared to LinkedIn",
      });
      
      // Reset form after successful posting
      setUserContent('<p>Write your LinkedIn post here...</p>');
      setGeneratedContent('');
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post to LinkedIn",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-2">Instant Post</h1>
      <p className="text-muted-foreground mb-6">
        Create and publish LinkedIn content instantly
      </p>

      <div className="grid gap-8">
        {/* Content Creation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Content</CardTitle>
            <CardDescription>Write your post or upload an image to generate content</CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditor 
              content={userContent} 
              onChange={setUserContent} 
            />
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>Upload an image to generate content ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={!selectedImage || isGenerating}
                  className="ml-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {previewUrl && (
                <div className="mt-4 border rounded-md p-2">
                  <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 object-contain rounded-md mx-auto"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Content Section, only shown when content is generated */}
        {generatedContent && (
          <Card>
            <CardHeader>
              <CardTitle>AI Generated Content</CardTitle>
              <CardDescription>Edit this content before posting if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={generatedContent}
                onChange={setGeneratedContent}
              />
            </CardContent>
          </Card>
        )}

        {/* Post to LinkedIn Button */}
        <Card>
          <CardHeader>
            <CardTitle>Ready to Share</CardTitle>
            <CardDescription>
              Post your content directly to LinkedIn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePostToLinkedIn} 
              disabled={isPosting} 
              className="w-full"
              size="lg"
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post to LinkedIn Now
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Your content will be published immediately to your LinkedIn profile
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default InstantPost;
