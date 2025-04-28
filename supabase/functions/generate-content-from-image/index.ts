
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, userId } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image: ${imageUrl} for user: ${userId}`);

    // Call OpenAI API with the image URL to generate LinkedIn content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional LinkedIn content writer. 
            You will be given an image and you need to create an engaging LinkedIn post that relates to the image. 
            Create a post that is professional, insightful, and would perform well on LinkedIn.
            Format your response with proper HTML formatting including paragraph tags and line breaks for better readability.
            Keep the content concise but impactful, aim for around 200-300 words.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Create a LinkedIn post based on this image:' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    let content = data.choices[0].message.content;
    
    // Ensure content is properly formatted as HTML
    if (!content.startsWith('<p>')) {
      content = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
    }
    
    console.log('Generated content successfully');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save the content as a draft in the content_ideas table
    const { error: insertError } = await supabase
      .from('content_ideas')
      .insert({
        user_id: userId,
        title: 'AI Generated from Image',
        content: content,
        status: 'Draft'
      });

    if (insertError) {
      console.error('Error saving content to database:', insertError);
      // Continue anyway, as this is not critical for the user experience
    }

    return new Response(
      JSON.stringify({ content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process image' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
