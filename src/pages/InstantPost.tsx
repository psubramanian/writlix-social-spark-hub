
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { useInstantPost } from '@/hooks/useInstantPost';
import { PremiumBadge } from '@/components/ui/premium-badge';

const InstantPost = () => {
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { generateContentFromImage, postToLinkedIn, isGenerating, isPosting } = useInstantPost();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "The image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateContent = async () => {
    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const generated = await generateContentFromImage(imageFile);
      setGeneratedContent(generated);
      toast({
        title: "Content generated",
        description: "Your LinkedIn post has been created based on the image.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content from image.",
        variant: "destructive",
      });
    }
  };

  const handlePostNow = async () => {
    const contentToPost = generatedContent || content;
    
    if (!contentToPost.trim()) {
      toast({
        title: "No content to post",
        description: "Please write or generate some content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await postToLinkedIn(contentToPost);
      toast({
        title: "Posted successfully",
        description: "Your content has been posted to LinkedIn.",
      });
      // Clear form after successful post
      setContent('');
      setGeneratedContent('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Posting failed",
        description: error.message || "Failed to post to LinkedIn.",
        variant: "destructive",
      });
    }
  };

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Instant LinkedIn Post
            <PremiumBadge />
          </h1>
          <p className="text-muted-foreground">
            Create and post content to LinkedIn instantly. Write your own content or generate it from an image.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Write your own content */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Your Content</CardTitle>
            <CardDescription>
              Write your LinkedIn post or upload an image to generate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your LinkedIn post here..."
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Image upload */}
        <Card>
          <CardHeader>
            <CardTitle>Image to Content</CardTitle>
            <CardDescription>Upload an image to generate a LinkedIn post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
              
              {imagePreview ? (
                <div className="relative w-full max-w-md mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto rounded-md object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Click to upload an image</p>
                  <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
                </div>
              )}
              
              <div className="mt-4">
                {!imagePreview ? (
                  <Button onClick={handleClickUpload} variant="outline">
                    Select Image
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerateContent} 
                    disabled={isGenerating || !imageFile}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Content from Image'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated content area */}
        {generatedContent && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>Edit before posting if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={generatedContent}
                onChange={setGeneratedContent}
              />
            </CardContent>
          </Card>
        )}
        
        {/* LinkedIn connection warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Before posting</AlertTitle>
          <AlertDescription>
            Make sure your LinkedIn account is connected in Settings. Your post will be published immediately.
          </AlertDescription>
        </Alert>
        
        {/* Post now button */}
        <Button 
          onClick={handlePostNow} 
          disabled={isPosting || (!content && !generatedContent)}
          className="w-full"
          size="lg"
        >
          {isPosting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post to LinkedIn Now'
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstantPost;
