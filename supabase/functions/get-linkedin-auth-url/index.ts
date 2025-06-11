
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
    console.log('Checking LinkedIn environment variables...');
    
    const clientId = Deno.env.get('WRITLIX_LINKEDIN_CLIENT_ID');
    const redirectUri = Deno.env.get('WRITLIX_LINKEDIN_REDIRECT_URI') || 'https://xhccvoivnelbzvzxmcoy.supabase.co/functions/v1/linkedin-oauth-simple';
    
    console.log('LinkedIn Client ID exists:', !!clientId);
    console.log('LinkedIn Redirect URI:', redirectUri);
    
    if (!clientId) {
      console.error('WRITLIX_LINKEDIN_CLIENT_ID environment variable not found');
      throw new Error('LinkedIn client ID not configured. Please set WRITLIX_LINKEDIN_CLIENT_ID in your Supabase project secrets.');
    }

    const { state } = await req.json();
    
    if (!state) {
      throw new Error('State parameter is required');
    }

    // Enhanced LinkedIn OAuth scope for better functionality
    const scope = 'openid profile email w_member_social r_organization_admin';
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const encodedScope = encodeURIComponent(scope);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=${encodedScope}`;

    console.log('Generated LinkedIn auth URL with enhanced scopes successfully');

    return new Response(JSON.stringify({
      success: true,
      authUrl: authUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate LinkedIn authorization URL'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
