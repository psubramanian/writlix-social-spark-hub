
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
    
    console.log('LinkedIn OAuth request received:', {
      code: code ? code.substring(0, 10) + '...' : 'missing',
      state: state || 'missing',
      user_id: user_id || 'missing',
      redirect_uri: redirect_uri || 'missing'
    });
    
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

    // Use the provided redirect_uri or the one stored in the database
    const finalRedirectUri = redirect_uri || credentials.redirect_uri || `https://xhccvoivnelbzvzxmcoy.supabase.co/auth/v1/callback`;
    console.log('Using redirect_uri:', finalRedirectUri);
    console.log('Client ID:', credentials.client_id);
    
    // Exchange the authorization code for an access token
    const tokenParams = new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': credentials.client_id,
      'client_secret': credentials.client_secret,
      'redirect_uri': finalRedirectUri,
    });

    console.log('Token exchange request params:', {
      grant_type: 'authorization_code',
      code: code.substring(0, 10) + '...',
      client_id: credentials.client_id,
      redirect_uri: finalRedirectUri
    });

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    const tokenData = await tokenResponse.json();
    
    console.log('LinkedIn token response status:', tokenResponse.status);
    console.log('LinkedIn token response:', {
      access_token: tokenData.access_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      error: tokenData.error,
      error_description: tokenData.error_description
    });
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LinkedIn token exchange failed:', tokenData);
      
      if (tokenData.error === 'invalid_grant') {
        throw new Error('LinkedIn authorization code has expired or is invalid. Please try connecting again.');
      }
      
      if (tokenData.error === 'invalid_redirect_uri') {
        throw new Error(`LinkedIn redirect URI mismatch. Expected: ${finalRedirectUri}. Please check your LinkedIn app configuration.`);
      }
      
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token');
    }

    console.log('Successfully obtained LinkedIn access token');
    
    // Get LinkedIn user profile using the new API endpoint
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      }
    });

    const profileData = await profileResponse.json();
    
    console.log('LinkedIn profile response status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      console.error('Failed to fetch LinkedIn profile:', profileData);
      
      // Fallback to older API if new one fails
      console.log('Attempting fallback to v2/me endpoint');
      const fallbackResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('Fallback profile data received');
        Object.assign(profileData, fallbackData);
      } else {
        console.error('Fallback profile fetch also failed');
        throw new Error('Failed to verify LinkedIn connection and retrieve profile');
      }
    }

    // Verify that the user has the necessary permissions
    try {
      const permissionsResponse = await fetch('https://api.linkedin.com/v2/me?projection=(id)', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        }
      });
      
      if (!permissionsResponse.ok) {
        console.warn('Could not verify LinkedIn permissions, but proceeding with connection');
      } else {
        console.log('LinkedIn permissions verified successfully');
      }
    } catch (permissionError) {
      console.warn('Permission check failed:', permissionError);
    }

    // Calculate expires_at from expires_in
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

    // Store the access token in user credentials
    const { error: tokenSaveError } = await supabase
      .from('user_linkedin_credentials')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        linkedin_profile_id: profileData.sub || profileData.id,
        linkedin_profile_data: profileData,
        redirect_uri: finalRedirectUri
      })
      .eq('user_id', user_id);
      
    if (tokenSaveError) {
      console.error('Failed to save LinkedIn token:', tokenSaveError);
      throw new Error('Failed to save LinkedIn authorization');
    }

    console.log('LinkedIn credentials saved successfully');

    // Extract name from the profile data
    const displayName = profileData.name || 
                       (profileData.given_name && profileData.family_name ? 
                        `${profileData.given_name} ${profileData.family_name}` : 
                        profileData.localizedFirstName ? 
                        `${profileData.localizedFirstName} ${profileData.localizedLastName || ''}` : 
                        'LinkedIn User');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'LinkedIn account connected successfully',
      profile: {
        name: displayName.trim(),
        id: profileData.sub || profileData.id
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
