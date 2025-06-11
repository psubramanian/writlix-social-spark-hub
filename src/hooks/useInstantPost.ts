
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function useInstantPost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postingPlatform, setPostingPlatform] = useState<string | null>(null);

  // Helper function to sanitize filenames
  const sanitizeFileName = (fileName: string): string => {
    // Replace special characters with underscores, keep file extension
    const name = fileName.split('.').slice(0, -1).join('.');
    const ext = fileName.split('.').pop();
    
    // Remove characters that might cause issues
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${sanitizedName}.${ext}`;
  };

  // Helper function to ensure content has proper HTML formatting
  const ensureHtmlFormatting = (content: string): string => {
    // If content doesn't contain any HTML tags, wrap it in paragraphs
    if (!content.includes('<')) {
      // Split by double newlines and wrap each part in a paragraph
      return content
        .split(/\n\s*\n/)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    return content;
  };

  // Function to generate content from image
  const generateContentFromImage = async (image: File): Promise<string> => {
    setIsGenerating(true);
    try {
      // Upload image to Supabase storage first
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Sanitize the filename to avoid potential issues
      const sanitizedName = sanitizeFileName(image.name);
      const fileName = `${user.id}_${Date.now()}_${sanitizedName}`;
      
      console.log(`Uploading image: ${fileName}`);
      
      // Upload to temp-images bucket with public read access
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('temp-images')
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error("Failed to upload image: " + uploadError.message);
      }

      // Get the public URL for the image
      const { data: publicUrlData } = supabase
        .storage
        .from('temp-images')
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL for image");
      }

      console.log(`Image URL: ${publicUrlData.publicUrl}`);

      // Call the edge function to generate content based on image
      const { data, error } = await supabase.functions.invoke('generate-content-from-image', {
        body: { 
          imageUrl: publicUrlData.publicUrl,
          userId: user.id,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error generating content from image');
      }

      if (!data || !data.content) {
        throw new Error('Invalid response from AI service');
      }

      // Apply HTML formatting to ensure consistency
      const formattedContent = ensureHtmlFormatting(data.content);
      return formattedContent;
    } catch (error: any) {
      console.error('Error in generateContentFromImage:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to post content directly to LinkedIn
  const postToLinkedIn = async (content: string): Promise<void> => {
    setIsPosting(true);
    setPostingPlatform('linkedin');
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Check if user has LinkedIn credentials
      const { data: credentials, error: tokensError } = await supabase
        .from('user_linkedin_credentials')
        .select('access_token')
        .eq('user_id', user.id as any)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking LinkedIn tokens:', tokensError);
        throw new Error("Error checking LinkedIn connection");
      }
      
      if (!credentials || !(credentials as any)?.access_token) {
        throw new Error("LinkedIn account not connected. Please connect your LinkedIn account in Settings.");
      }

      // Call our edge function to post to LinkedIn
      const { data, error } = await supabase.functions.invoke('post-to-linkedin-direct', {
        body: { 
          content,
          userId: user.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to LinkedIn');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to post to LinkedIn');
      }

      return;
    } catch (error: any) {
      console.error('Error in postToLinkedIn:', error);
      throw error;
    } finally {
      setIsPosting(false);
      setPostingPlatform(null);
    }
  };

  // Function to post content directly to Facebook
  const postToFacebook = async (content: string): Promise<void> => {
    setIsPosting(true);
    setPostingPlatform('facebook');
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Check if user has Facebook credentials
      const { data: credentials, error: tokensError } = await supabase
        .from('user_facebook_credentials')
        .select('access_token, long_lived_token')
        .eq('user_id', user.id as any)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking Facebook tokens:', tokensError);
        throw new Error("Error checking Facebook connection");
      }
      
      if (!credentials || (!(credentials as any)?.access_token && !(credentials as any)?.long_lived_token)) {
        throw new Error("Facebook account not connected. Please connect your Facebook account in Settings.");
      }

      // Call our edge function to post to Facebook
      const { data, error } = await supabase.functions.invoke('post-to-facebook-direct', {
        body: { 
          content,
          userId: user.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to Facebook');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to post to Facebook');
      }

      return;
    } catch (error: any) {
      console.error('Error in postToFacebook:', error);
      throw error;
    } finally {
      setIsPosting(false);
      setPostingPlatform(null);
    }
  };

  // Function to post content directly to Instagram (requires image)
  const postToInstagram = async (content: string, imageUrl: string): Promise<void> => {
    setIsPosting(true);
    setPostingPlatform('instagram');
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Check if user has Instagram credentials
      const { data: credentials, error: tokensError } = await supabase
        .from('user_instagram_credentials')
        .select('access_token, long_lived_token')
        .eq('user_id', user.id as any)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking Instagram tokens:', tokensError);
        throw new Error("Error checking Instagram connection");
      }
      
      if (!credentials || (!(credentials as any)?.access_token && !(credentials as any)?.long_lived_token)) {
        throw new Error("Instagram account not connected. Please connect your Instagram account in Settings.");
      }

      if (!imageUrl) {
        throw new Error("Instagram requires an image for posting. Please provide an image URL.");
      }

      // Call our edge function to post to Instagram
      const { data, error } = await supabase.functions.invoke('post-to-instagram-direct', {
        body: { 
          content,
          userId: user.id,
          imageUrl
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error posting to Instagram');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to post to Instagram');
      }

      return;
    } catch (error: any) {
      console.error('Error in postToInstagram:', error);
      throw error;
    } finally {
      setIsPosting(false);
      setPostingPlatform(null);
    }
  };

  return {
    generateContentFromImage,
    postToLinkedIn,
    postToFacebook,
    postToInstagram,
    isGenerating,
    isPosting,
    postingPlatform
  };
}
