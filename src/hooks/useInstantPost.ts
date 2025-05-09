import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';

export function useInstantPost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Helper function to sanitize filenames
  const sanitizeFileName = (fileName: string): string => {
    // Replace special characters with underscores, keep file extension
    const name = fileName.split('.').slice(0, -1).join('.');
    const ext = fileName.split('.').pop();
    
    // Remove characters that might cause issues
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${sanitizedName}.${ext}`;
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

      return data.content;
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
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Check if user has LinkedIn credentials
      const { data: credentials, error: tokensError } = await supabase
        .from('user_linkedin_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (tokensError) {
        console.error('Error checking LinkedIn tokens:', tokensError);
        throw new Error("Error checking LinkedIn connection");
      }
      
      if (!credentials?.access_token) {
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
    }
  };

  return {
    generateContentFromImage,
    postToLinkedIn,
    isGenerating,
    isPosting
  };
}
