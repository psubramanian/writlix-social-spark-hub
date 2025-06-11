
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { code, state, user_id, redirect_uri } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    // Get the Facebook credentials for this user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_facebook_credentials')
      .select('client_id, client_secret, redirect_uri')
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (credentialsError || !credentials) {
      console.error('Error fetching Facebook credentials:', credentialsError);
      throw new Error('Facebook credentials not found. Please add your Facebook API credentials in Settings.');
    }

    // Use the provided redirect_uri or the one stored in the database
    const finalRedirectUri = redirect_uri || credentials.redirect_uri || '';
    console.log('Using redirect_uri:', finalRedirectUri);
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'code': code,
        'redirect_uri': finalRedirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData);
      throw new Error('Failed to exchange authorization code for access token');
    }

    console.log('Successfully obtained Facebook access token');
    
    // Get long-lived access token
    const longLivedTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}&fb_exchange_token=${tokenData.access_token}`);
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (!longLivedTokenResponse.ok || !longLivedTokenData.access_token) {
      console.error('Error getting long-lived token:', longLivedTokenData);
      // Continue with short-lived token if unable to get long-lived token
    }
    
    const finalToken = longLivedTokenData.access_token || tokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || tokenData.expires_in || 3600;
    
    // Get Facebook user profile to confirm connection
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

    // Store the access token in user credentials
    const { error: tokenSaveError } = await supabase
      .from('user_facebook_credentials')
      .update({
        access_token: tokenData.access_token,
        long_lived_token: longLivedTokenData.access_token || null,
        expires_at: expiresAt.toISOString(),
        facebook_user_id: profileData.id,
        facebook_profile_data: profileData,
        redirect_uri: finalRedirectUri // Save the redirect URI that was used
      })
      .eq('user_id', user_id);
      
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
