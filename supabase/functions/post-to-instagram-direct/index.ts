
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { content, userId, imageUrl } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!imageUrl) {
      throw new Error('Image URL is required for Instagram posts');
    }
    
    // Get Instagram credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_instagram_credentials')
      .select('access_token, long_lived_token, instagram_user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (credentialsError || !credentials) {
      throw new Error('Instagram credentials not found. Please reconnect your Instagram account.');
    }
    
    if (!credentials.access_token && !credentials.long_lived_token) {
      throw new Error('Instagram access token not found. Please reconnect your Instagram account.');
    }

    const accessToken = credentials.long_lived_token || credentials.access_token;
    
    // Instagram API requires a two-step process:
    // 1. Create a media container
    // 2. Publish the container to the feed
    
    // First, create the media container
    const createMediaResponse = await fetch(`https://graph.instagram.com/v18.0/me/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      })
    });
    
    const createMediaData = await createMediaResponse.json();
    
    if (!createMediaResponse.ok) {
      console.error('Instagram media creation error:', createMediaData);
      throw new Error(createMediaData.error?.message || 'Failed to create Instagram media');
    }
    
    const creationId = createMediaData.id;
    if (!creationId) {
      throw new Error('Failed to get creation ID from Instagram');
    }
    
    // Now publish the media
    const publishResponse = await fetch(`https://graph.instagram.com/v18.0/me/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('Instagram publishing error:', publishData);
      
      // Handle expired token
      if (publishResponse.status === 401 || publishData.error?.code === 190) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Instagram authorization expired. Please reconnect your Instagram account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }
      
      throw new Error(publishData.error?.message || 'Failed to publish to Instagram');
    }
    
    console.log('Successfully posted to Instagram:', publishData);
    
    return new Response(JSON.stringify({
      success: true,
      postId: publishData.id,
      message: 'Posted successfully to Instagram'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to post to Instagram'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
