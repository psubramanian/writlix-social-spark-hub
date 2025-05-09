
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  imageUrl: string;
  userId: string;
}

// Helper function to normalize and fix the image URL
function normalizeImageUrl(url: string): string {
  if (!url) return url;
  
  // Handle the specific case of double slash after bucket name
  // This fixes the URL to ensure it has double slashes after 'temp-images'
  if (url.includes('/temp-images/')) {
    return url.replace('/temp-images/', '/temp-images//');
  }
  
  return url;
}

// Function to handle retries for OpenAI API calls
async function callOpenAIWithRetry(
  openai: OpenAI, 
  imageUrl: string, 
  maxRetries = 3
): Promise<string> {
  let lastError;
  let normalizedUrl = normalizeImageUrl(imageUrl);
  
  console.log(`Using normalized image URL: ${normalizedUrl}`);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system', 
            content: 'You are a professional LinkedIn content creator expert. Analyze the image and generate an engaging LinkedIn post about it. The post should be professionally written, include relevant hashtags, and be formatted for LinkedIn with line breaks and emojis where appropriate. Use proper HTML formatting tags like <p>, <strong>, <em>, <ul>, <li>, <h3> for structure and emphasis. Include line breaks with <br> where appropriate. Keep the post concise but impactful, around 200-300 words maximum.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Create an engaging LinkedIn post based on this image:' },
              { type: 'image_url', image_url: { url: normalizedUrl } }
            ]
          }
        ],
        max_tokens: 500,
      });
      
      let content = response.choices[0]?.message?.content || 'Failed to generate content';
      
      // Clean up any markdown code blocks that might be in the response
      // These regex patterns will remove code block markers commonly found in AI responses
      content = content.replace(/```html\s*/g, '');
      content = content.replace(/```\s*$/g, '');
      content = content.replace(/```/g, ''); // Remove any remaining triple backticks
      content = content.trim();
      
      return content;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // If this is an image URL error, try alternative URL format
      if (error.code === 'invalid_image_url' && attempt === 0) {
        // Try with a different URL normalization approach
        console.log("Trying alternative URL format...");
        const urlObj = new URL(imageUrl);
        normalizedUrl = urlObj.toString();
        console.log(`Alternative URL: ${normalizedUrl}`);
      } else {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('Failed to generate content after multiple attempts');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }
    
    // Create Supabase and OpenAI clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Parse request body
    const { imageUrl, userId } = await req.json() as RequestBody;
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Processing image: ${imageUrl} for user: ${userId}`);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('User validation error:', userError);
      throw new Error('User not found');
    }
    
    // Call OpenAI API with retry mechanism
    const generatedContent = await callOpenAIWithRetry(openai, imageUrl);
    
    console.log('Successfully generated content');
    
    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in generate-content-from-image:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during content generation',
        details: error.code || 'unknown_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
