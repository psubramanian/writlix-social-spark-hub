
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get centralized Facebook app credentials
    const clientId = Deno.env.get('WRITLIX_FACEBOOK_CLIENT_ID');
    const clientSecret = Deno.env.get('WRITLIX_FACEBOOK_CLIENT_SECRET');
    const redirectUri = Deno.env.get('WRITLIX_FACEBOOK_REDIRECT_URI');
    
    console.log('Environment variables check:', {
      clientId: clientId ? 'present' : 'missing',
      clientSecret: clientSecret ? 'present' : 'missing',
      redirectUri: redirectUri ? 'present' : 'missing'
    });
    
    if (!clientId || !clientSecret) {
      console.error('Missing required Facebook environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Facebook app credentials not configured. Please contact support.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    const finalRedirectUri = redirectUri || 'https://xhccvoivnelbzvzxmcoy.supabase.co/functions/v1/facebook-oauth-simple';
    
    let code, state, user_id;
    
    // Handle both GET (URL params) and POST (JSON body) requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      user_id = url.searchParams.get('user_id');
    } else {
      const body = await req.json();
      code = body.code;
      state = body.state;
      user_id = body.user_id;
    }
    
    console.log('OAuth request details:', {
      code: code ? 'present' : 'missing',
      state: state || 'missing',
      user_id: user_id || 'missing',
      method: req.method
    });
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    console.log('Processing Facebook OAuth with centralized credentials');
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'client_id': clientId,
        'client_secret': clientSecret,
        'code': code,
        'redirect_uri': finalRedirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    console.log('Token response:', {
      status: tokenResponse.status,
      access_token: tokenData.access_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in,
      error: tokenData.error
    });
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData);
      throw new Error('Failed to connect Facebook account');
    }

    console.log('Successfully obtained Facebook access token');
    
    // Get long-lived access token
    const longLivedTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`);
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    
    const finalToken = longLivedTokenData.access_token || tokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || tokenData.expires_in || 3600;
    
    // Get Facebook user profile
    const profileResponse = await fetch('https://graph.facebook.com/v18.0/me?fields=id,name', {
      headers: {
        'Authorization': `Bearer ${finalToken}`,
      }
    });

    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok) {
      console.error('Failed to fetch Facebook profile:', profileData);
      throw new Error('Failed to verify Facebook connection');
    }

    // Calculate expires_at from expires_in
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Store the user's access token with manual updated_at
    const { error: tokenSaveError } = await supabase
      .from('user_facebook_credentials')
      .upsert({
        user_id: user_id,
        client_id: clientId,
        client_secret: 'CENTRALIZED',
        access_token: tokenData.access_token,
        long_lived_token: longLivedTokenData.access_token || null,
        expires_at: expiresAt.toISOString(),
        facebook_user_id: profileData.id,
        facebook_profile_data: profileData,
        redirect_uri: finalRedirectUri,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (tokenSaveError) {
      console.error('Failed to save Facebook token:', tokenSaveError);
      throw new Error('Failed to save Facebook authorization');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Facebook account connected successfully',
      profile: {
        name: profileData.name || 'Facebook User',
        id: profileData.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to process Facebook authentication'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
