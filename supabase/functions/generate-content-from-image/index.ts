
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
    
    console.log(`Generating content from image: ${imageUrl} for user: ${userId}`);
    
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
    
    // Call OpenAI API to analyze the image and generate content
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system', 
          content: 'You are a professional LinkedIn content creator expert. Analyze the image and generate an engaging LinkedIn post about it. The post should be professionally written, include relevant hashtags, and be formatted for LinkedIn with line breaks and emojis where appropriate. Keep the post concise but impactful, around 200-300 words maximum.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Create an engaging LinkedIn post based on this image:' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 500,
    });
    
    const generatedContent = response.choices[0]?.message?.content || 'Failed to generate content';
    
    console.log('Successfully generated content');
    
    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in generate-content-from-image:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred during content generation' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
