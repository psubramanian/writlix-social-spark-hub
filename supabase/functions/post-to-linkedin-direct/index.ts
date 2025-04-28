
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  content: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { content, userId } = await req.json() as RequestBody;
    
    if (!content) {
      throw new Error('Content is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Posting content to LinkedIn for user: ${userId}`);
    
    // Get LinkedIn credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_linkedin_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (credentialsError || !credentials) {
      console.error('LinkedIn credentials error:', credentialsError);
      throw new Error('LinkedIn credentials not found');
    }
    
    if (!credentials.access_token) {
      throw new Error('LinkedIn access token not found');
    }
    
    // Check if token has expired
    if (credentials.expires_at) {
      const expiresAt = new Date(credentials.expires_at);
      if (expiresAt < new Date()) {
        // Token has expired, should refresh but for now throw error
        throw new Error('LinkedIn access token has expired');
      }
    }
    
    // Make LinkedIn API call to post content
    const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${credentials.linkedin_profile_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });
    
    if (!linkedinResponse.ok) {
      const errorData = await linkedinResponse.json();
      console.error('LinkedIn API error:', errorData);
      throw new Error(`LinkedIn API error: ${linkedinResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const linkedinData = await linkedinResponse.json();
    console.log('Successfully posted to LinkedIn:', linkedinData);
    
    // Store the post in the database as published content
    const { data: contentData, error: contentError } = await supabase
      .from('content_ideas')
      .insert({
        title: content.substring(0, 50) + '...',
        content: content,
        status: 'Published',
        user_id: userId
      })
      .select();
    
    if (contentError) {
      console.error('Error saving content to database:', contentError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Content posted to LinkedIn successfully',
        postId: linkedinData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in post-to-linkedin-direct:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred while posting to LinkedIn' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
