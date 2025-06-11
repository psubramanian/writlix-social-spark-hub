
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
    
    // Get centralized LinkedIn app credentials with better error handling
    const clientId = Deno.env.get('WRITLIX_LINKEDIN_CLIENT_ID');
    const clientSecret = Deno.env.get('WRITLIX_LINKEDIN_CLIENT_SECRET');
    const redirectUri = Deno.env.get('WRITLIX_LINKEDIN_REDIRECT_URI');
    
    console.log('Environment variables check:', {
      clientId: clientId ? 'present' : 'missing',
      clientSecret: clientSecret ? 'present' : 'missing',
      redirectUri: redirectUri ? 'present' : 'missing'
    });
    
    if (!clientId || !clientSecret) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'LinkedIn app credentials not configured. Please contact support.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    const finalRedirectUri = redirectUri || 'https://xhccvoivnelbzvzxmcoy.supabase.co/functions/v1/linkedin-oauth-simple';
    
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
    
    console.log('Processing LinkedIn OAuth with centralized credentials');
    
    // Exchange the authorization code for an access token
    const tokenParams = new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': clientId,
      'client_secret': clientSecret,
      'redirect_uri': finalRedirectUri,
    });

    console.log('Token exchange request:', {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: finalRedirectUri,
      code_preview: code.substring(0, 10) + '...'
    });

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    const tokenData = await tokenResponse.json();
    
    console.log('Token response:', {
      status: tokenResponse.status,
      access_token: tokenData.access_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in,
      error: tokenData.error,
      error_description: tokenData.error_description
    });
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LinkedIn token exchange failed:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to connect LinkedIn account');
    }

    console.log('Successfully obtained LinkedIn access token');
    
    // Get LinkedIn user profile using the v2/userinfo endpoint
    let profileData = null;
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (profileResponse.ok) {
      profileData = await profileResponse.json();
      console.log('LinkedIn profile data received successfully');
    } else {
      console.log('Userinfo failed, trying basic profile endpoint');
      // Fallback to basic profile endpoint
      const fallbackResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,localizedFirstName,localizedLastName)', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });
      
      if (fallbackResponse.ok) {
        profileData = await fallbackResponse.json();
        console.log('LinkedIn profile data received via fallback');
      } else {
        // Create minimal profile data if API calls fail
        profileData = {
          sub: 'linkedin_user_' + Date.now(),
          name: 'LinkedIn User',
          given_name: 'LinkedIn',
          family_name: 'User'
        };
        console.log('Using minimal profile data due to API limitations');
      }
    }

    // Calculate expires_at from expires_in
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

    // Store the user's access token with manual updated_at
    const { error: tokenSaveError } = await supabase
      .from('user_linkedin_credentials')
      .upsert({
        user_id: user_id,
        client_id: clientId,
        client_secret: 'CENTRALIZED',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt.toISOString(),
        linkedin_profile_id: profileData.sub || profileData.id,
        linkedin_profile_data: profileData,
        redirect_uri: finalRedirectUri,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (tokenSaveError) {
      console.error('Failed to save LinkedIn token:', tokenSaveError);
      throw new Error('Failed to save LinkedIn authorization');
    }

    // Clear existing pages and add personal profile
    await supabase
      .from('user_linkedin_pages')
      .delete()
      .eq('user_id', user_id);

    // Add personal profile as a "page"
    const personalPageName = profileData.name || 
                            (profileData.given_name && profileData.family_name ? 
                             `${profileData.given_name} ${profileData.family_name}` : 
                             profileData.localizedFirstName ? 
                             `${profileData.localizedFirstName} ${profileData.localizedLastName || ''}` : 
                             'Personal Profile');

    const { error: personalPageError } = await supabase
      .from('user_linkedin_pages')
      .insert({
        user_id: user_id,
        page_type: 'personal',
        page_id: profileData.sub || profileData.id,
        page_name: personalPageName,
        page_data: profileData,
        is_selected: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (personalPageError) {
      console.error('Failed to save personal page:', personalPageError);
    }

    // Try to fetch organization pages with enhanced error handling
    try {
      console.log('Attempting to fetch organization pages...');
      const organizationsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (organizationsResponse.ok) {
        const organizationsData = await organizationsResponse.json();
        console.log('Organizations response:', organizationsData);

        if (organizationsData.elements && organizationsData.elements.length > 0) {
          for (const orgAcl of organizationsData.elements) {
            if (orgAcl.role === 'ADMINISTRATOR' && orgAcl.organization) {
              try {
                const orgId = orgAcl.organization.split(':').pop();
                const orgResponse = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                  },
                });

                if (orgResponse.ok) {
                  const orgData = await orgResponse.json();
                  
                  await supabase
                    .from('user_linkedin_pages')
                    .insert({
                      user_id: user_id,
                      page_type: 'company',
                      page_id: orgId,
                      page_name: orgData.localizedName || 'Company Page',
                      page_data: orgData,
                      is_selected: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    });
                  
                  console.log(`Added company page: ${orgData.localizedName}`);
                }
              } catch (orgError) {
                console.error('Error fetching organization details:', orgError);
              }
            }
          }
        }
      } else {
        console.log('Organization access not available or user has no admin rights');
      }
    } catch (orgError) {
      console.log('Organization fetch failed (expected for personal accounts):', orgError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'LinkedIn account connected successfully',
      profile: {
        name: personalPageName,
        id: profileData.sub || profileData.id
      },
      needsPageSelection: true
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
