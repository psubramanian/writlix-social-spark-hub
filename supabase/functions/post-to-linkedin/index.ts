
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
    
    // Get the user's LinkedIn credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_linkedin_credentials')
      .select('client_id, client_secret')
      .eq('user_id', post.user_id)
      .maybeSingle();
      
    if (credentialsError) {
      console.error('Error fetching LinkedIn credentials:', credentialsError);
      throw new Error('Failed to retrieve LinkedIn credentials');
    }
    
    if (!credentials) {
      throw new Error('LinkedIn credentials not found for this user. Please add your LinkedIn API credentials in the Settings page.');
    }
    
    console.log('LinkedIn credentials found for user');

    // Call the database function to update status to Published
    const { error: triggerError } = await supabase
      .rpc('trigger_linkedin_post', { post_id: postId });

    if (triggerError) {
      console.error('Error triggering LinkedIn post:', triggerError);
      throw triggerError;
    }

    // In a real implementation, here we would call the LinkedIn API using the user's credentials
    // For now, we'll provide more detailed logging about what would happen
    
    // This is where we would make the actual LinkedIn API call
    // Example (not actually executed):
    /*
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`, // We would need OAuth flow to get this
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: `urn:li:person:${userId}`,
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
      })
    });
    */
    
    const simulatedLinkedInResponse = {
      success: true,
      post_id: `linkedin-${Date.now()}`,
      url: `https://linkedin.com/post/${Date.now()}`,
      timestamp: new Date().toISOString(),
      clientIdUsed: credentials.client_id.substring(0, 5) + '...' // Only showing part of the client ID for security
    };

    console.log('LinkedIn post simulation details:', simulatedLinkedInResponse);
    console.log('IMPORTANT: This is still a simulation! To post to LinkedIn for real, you need to:');
    console.log('1. Complete the LinkedIn OAuth flow to get an access token');
    console.log('2. Use the proper LinkedIn API endpoints to post content');
    console.log('3. Set up proper error handling and rate limiting');

    // Update the content_ideas status to reflect it's been published
    const { error: updateError } = await supabase
      .from('content_ideas')
      .update({ status: 'Published' })
      .eq('id', post.content_ideas.id);
    
    if (updateError) {
      console.error('Error updating content status:', updateError);
      // We won't throw here as the post was "successful", just log the error
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Post successfully shared to LinkedIn (simulated)',
      note: 'Real LinkedIn integration requires OAuth flow completion',
      linkedInDetails: simulatedLinkedInResponse 
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
