
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, accept, accept-language, cache-control, pragma',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking Facebook environment variables...');
    
    const clientId = Deno.env.get('WRITLIX_FACEBOOK_CLIENT_ID');
    const redirectUri = Deno.env.get('WRITLIX_FACEBOOK_REDIRECT_URI') || 'https://xhccvoivnelbzvzxmcoy.supabase.co/functions/v1/facebook-oauth-simple';
    
    console.log('Facebook Client ID exists:', !!clientId);
    console.log('Facebook Redirect URI:', redirectUri);
    
    if (!clientId) {
      console.error('WRITLIX_FACEBOOK_CLIENT_ID environment variable not found');
      throw new Error('Facebook client ID not configured. Please set WRITLIX_FACEBOOK_CLIENT_ID in your Supabase project secrets.');
    }

    const { state } = await req.json();
    
    if (!state) {
      throw new Error('State parameter is required');
    }

    const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile';
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const encodedScope = encodeURIComponent(scope);

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=${encodedScope}`;

    console.log('Generated Facebook auth URL successfully');

    return new Response(JSON.stringify({
      success: true,
      authUrl: authUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate Facebook authorization URL'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
