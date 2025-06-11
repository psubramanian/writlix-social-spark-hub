
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
    
    const { postId, userId } = await req.json();
    
    if (!postId) {
      throw new Error('Post ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get the post content
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('content_id')
      .eq('id', postId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (postError || !post) {
      throw new Error('Post not found');
    }
    
    // Get the content
    const { data: content, error: contentError } = await supabase
      .from('content_ideas')
      .select('content')
      .eq('id', post.content_id)
      .maybeSingle();
      
    if (contentError || !content) {
      throw new Error('Content not found');
    }
    
    // Get LinkedIn credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_linkedin_credentials')
      .select('access_token, linkedin_profile_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (credentialsError || !credentials || !credentials.access_token) {
      throw new Error('LinkedIn access token not found. Please reconnect your LinkedIn account.');
    }
    
    // Prepare the LinkedIn Share API request
    const shareData = {
      author: `urn:li:person:${credentials.linkedin_profile_id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content.content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };
    
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
    
    if (!response.ok) {
      console.error('LinkedIn posting error:', responseData);
      
      // Handle expired token
      if (response.status === 401) {
        return new Response(JSON.stringify({
          success: false,
          error: 'LinkedIn authorization expired. Please reconnect your LinkedIn account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }
      
      throw new Error(responseData.message || 'Failed to post to LinkedIn');
    }
    
    // Update post status
    const { error: updateError } = await supabase.rpc('trigger_linkedin_post', { post_id: postId });
    
    if (updateError) {
      console.error('Error updating post status:', updateError);
      // If the function doesn't exist, update content status directly
      const { data: postData } = await supabase
        .from('scheduled_posts')
        .select('content_id')
        .eq('id', postId)
        .single();
        
      if (postData) {
        await supabase
          .from('content_ideas')
          .update({ status: 'Published' })
          .eq('id', postData.content_id);
      }
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
