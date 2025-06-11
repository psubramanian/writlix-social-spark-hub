
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
    
    console.log('LinkedIn posting request received:', {
      userId: userId || 'missing',
      contentLength: content ? content.length : 0
    });
    
    if (!content) {
      throw new Error('Content is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get LinkedIn credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_linkedin_credentials')
      .select('access_token, linkedin_profile_id, expires_at')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (credentialsError || !credentials || !credentials.access_token) {
      console.error('LinkedIn credentials error:', credentialsError);
      throw new Error('LinkedIn access token not found. Please reconnect your LinkedIn account.');
    }

    console.log('LinkedIn credentials found:', {
      access_token: credentials.access_token ? 'present' : 'missing',
      linkedin_profile_id: credentials.linkedin_profile_id || 'missing',
      expires_at: credentials.expires_at || 'no expiration'
    });

    // Check if token is expired
    if (credentials.expires_at) {
      const expiresAt = new Date(credentials.expires_at);
      const now = new Date();
      if (expiresAt < now) {
        console.error('LinkedIn token expired:', {
          expires_at: credentials.expires_at,
          current_time: now.toISOString()
        });
        throw new Error('LinkedIn access token has expired. Please reconnect your LinkedIn account.');
      }
    }
    
    // Validate that we can access LinkedIn profile before posting
    try {
      console.log('Validating LinkedIn token...');
      const profileCheck = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        }
      });
      
      console.log('LinkedIn token validation response status:', profileCheck.status);
      
      if (!profileCheck.ok) {
        if (profileCheck.status === 401) {
          console.error('LinkedIn token validation failed: 401 Unauthorized');
          throw new Error('LinkedIn authorization expired. Please reconnect your LinkedIn account.');
        }
        console.error('LinkedIn token validation failed:', profileCheck.status);
        throw new Error('Failed to validate LinkedIn connection.');
      }
      
      console.log('LinkedIn token validation successful');
    } catch (validationError) {
      console.error('LinkedIn token validation failed:', validationError);
      throw new Error('LinkedIn authorization expired. Please reconnect your LinkedIn account.');
    }
    
    // Prepare the LinkedIn Share API request
    const shareData = {
      author: `urn:li:person:${credentials.linkedin_profile_id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };
    
    console.log('Posting to LinkedIn with author:', `urn:li:person:${credentials.linkedin_profile_id}`);
    
    // Post content to LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(shareData)
    });
    
    const responseData = await response.json();
    
    console.log('LinkedIn posting response status:', response.status);
    console.log('LinkedIn posting response:', responseData);
    
    if (!response.ok) {
      console.error('LinkedIn posting error:', responseData);
      
      // Handle specific LinkedIn API errors
      if (response.status === 401) {
        return new Response(JSON.stringify({
          success: false,
          error: 'LinkedIn authorization expired. Please reconnect your LinkedIn account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }
      
      if (response.status === 403) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions to post to LinkedIn. Please ensure your app has w_member_social permission and reconnect your account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: 'LinkedIn API rate limit exceeded. Please try again later.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        });
      }
      
      throw new Error(responseData.message || responseData.error || 'Failed to post to LinkedIn');
    }
    
    console.log('Successfully posted to LinkedIn:', responseData);
    
    return new Response(JSON.stringify({
      success: true,
      postId: responseData.id,
      message: 'Posted successfully to LinkedIn'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to post to LinkedIn'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
