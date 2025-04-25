
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, userId } = await req.json();
    
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get post content
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select(`
        id,
        user_id,
        content_ideas (
          id,
          title,
          content
        )
      `)
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      throw postError;
    }

    if (!post || !post.content_ideas) {
      throw new Error('Post or content not found');
    }

    console.log('Post content retrieved successfully:', post.content_ideas.title);
    
    // Get the user's LinkedIn access token
    const { data: token, error: tokenError } = await supabase
      .from('user_linkedin_tokens')
      .select('access_token, linkedin_profile_id, expires_at')
      .eq('user_id', post.user_id)
      .maybeSingle();
      
    if (tokenError) {
      console.error('Error fetching LinkedIn token:', tokenError);
      throw new Error('Failed to retrieve LinkedIn token');
    }
    
    if (!token || !token.access_token) {
      throw new Error('LinkedIn access token not found. Please connect your LinkedIn account in the Settings page.');
    }
    
    // Check if token is expired
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      throw new Error('LinkedIn access token has expired. Please reconnect your LinkedIn account in Settings.');
    }
    
    console.log('LinkedIn token found for user');

    // Call the database function to update status to Published
    const { error: triggerError } = await supabase
      .rpc('trigger_linkedin_post', { post_id: postId });

    if (triggerError) {
      console.error('Error triggering LinkedIn post:', triggerError);
      throw triggerError;
    }

    // Now let's actually post to LinkedIn API
    const linkedInPostData = {
      author: `urn:li:person:${token.linkedin_profile_id || 'me'}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content_ideas.content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };
    
    console.log('Sending post to LinkedIn API:', JSON.stringify(linkedInPostData, null, 2).substring(0, 500) + '...');
    
    // Actually post to LinkedIn
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(linkedInPostData)
    });
    
    const responseData = await linkedInResponse.json();
    
    if (!linkedInResponse.ok) {
      console.error('LinkedIn API error:', responseData);
      throw new Error(`LinkedIn API error: ${responseData.message || JSON.stringify(responseData)}`);
    }
    
    console.log('LinkedIn post successful:', responseData);

    // Update the content_ideas status to reflect it's been published
    const { error: updateError } = await supabase
      .from('content_ideas')
      .update({ status: 'Published' })
      .eq('id', post.content_ideas.id);
    
    if (updateError) {
      console.error('Error updating content status:', updateError);
      // We won't throw here as the post was successful, just log the error
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Post successfully shared to LinkedIn',
      linkedInDetails: {
        id: responseData.id,
        createdAt: new Date().toISOString(),
        profileId: token.linkedin_profile_id
      }
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
