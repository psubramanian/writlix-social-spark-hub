
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
    
    // Get the LinkedIn credentials for this user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_linkedin_credentials')
      .select('client_id, client_secret, redirect_uri')
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (credentialsError || !credentials) {
      console.error('Error fetching LinkedIn credentials:', credentialsError);
      throw new Error('LinkedIn credentials not found. Please add your LinkedIn API credentials in Settings.');
    }

    // Use the provided redirect_uri or the one stored in the database, fall back to a default if needed
    const finalRedirectUri = redirect_uri || credentials.redirect_uri || `https://xhccvoivnelbzvzxmcoy.supabase.co/auth/v1/callback`;
    console.log('Using redirect_uri:', finalRedirectUri);
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'redirect_uri': finalRedirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LinkedIn token exchange failed:', tokenData);
      throw new Error('Failed to exchange authorization code for access token');
    }

    console.log('Successfully obtained LinkedIn access token');
    
    // Get LinkedIn user profile to confirm connection
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      }
    });

    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok) {
      console.error('Failed to fetch LinkedIn profile:', profileData);
      throw new Error('Failed to verify LinkedIn connection');
    }

    // Calculate expires_at from expires_in
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Store the access token in user credentials
    const { error: tokenSaveError } = await supabase
      .from('user_linkedin_credentials')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        linkedin_profile_id: profileData.id,
        linkedin_profile_data: profileData,
        redirect_uri: finalRedirectUri // Save the redirect URI that was used for this successful authentication
      })
      .eq('user_id', user_id);
      
    if (tokenSaveError) {
      console.error('Failed to save LinkedIn token:', tokenSaveError);
      throw new Error('Failed to save LinkedIn authorization');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'LinkedIn account connected successfully',
      profile: {
        name: profileData.localizedFirstName 
          ? `${profileData.localizedFirstName} ${profileData.localizedLastName || ''}`
          : 'LinkedIn User',
        id: profileData.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to process LinkedIn authentication'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
