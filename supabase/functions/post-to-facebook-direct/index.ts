
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
    
    const { content, userId } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get Facebook credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_facebook_credentials')
      .select('access_token, long_lived_token, facebook_user_id, facebook_profile_data')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (credentialsError || !credentials) {
      throw new Error('Facebook credentials not found. Please reconnect your Facebook account.');
    }
    
    if (!credentials.access_token && !credentials.long_lived_token) {
      throw new Error('Facebook access token not found. Please reconnect your Facebook account.');
    }

    const accessToken = credentials.long_lived_token || credentials.access_token;
    
    // Get user pages - posts need to be made to a Facebook page, not a personal profile
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/${credentials.facebook_user_id}/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();
    
    if (!pagesResponse.ok) {
      console.error('Facebook pages fetch error:', pagesData);
      throw new Error('Failed to retrieve your Facebook pages. Please ensure you have Facebook Pages connected to your account.');
    }
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to have at least one Facebook page to post content.');
    }
    
    // Use the first page
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    
    // Post content to Facebook
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        access_token: pageAccessToken
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Facebook posting error:', responseData);
      
      // Handle expired token
      if (response.status === 401 || responseData.error?.code === 190) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Facebook authorization expired. Please reconnect your Facebook account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }
      
      throw new Error(responseData.error?.message || 'Failed to post to Facebook');
    }
    
    console.log('Successfully posted to Facebook:', responseData);
    
    return new Response(JSON.stringify({
      success: true,
      postId: responseData.id,
      message: 'Posted successfully to Facebook'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to post to Facebook'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
