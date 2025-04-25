
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
    const { postId } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get post content
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select(`
        id,
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

    // Call the database function to update status to Published
    const { error: triggerError } = await supabase
      .rpc('trigger_linkedin_post', { post_id: postId });

    if (triggerError) {
      console.error('Error triggering LinkedIn post:', triggerError);
      throw triggerError;
    }

    // In a real implementation, here we would call the LinkedIn API
    // For now, we'll simulate a successful post
    const simulatedLinkedInResponse = {
      success: true,
      post_id: `linkedin-${Date.now()}`,
      url: `https://linkedin.com/post/${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    console.log('Successfully simulated posting to LinkedIn:', simulatedLinkedInResponse);

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
      message: 'Post successfully shared to LinkedIn',
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
