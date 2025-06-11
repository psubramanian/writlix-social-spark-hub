
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
    
    const { postId, userId, imageUrl } = await req.json();
    
    if (!postId) {
      throw new Error('Post ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!imageUrl) {
      throw new Error('Instagram requires an image for posting. Please provide an image URL.');
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
    
    // Get Instagram credentials for the user
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_instagram_credentials')
      .select('access_token, long_lived_token, instagram_user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (credentialsError || !credentials || (!credentials.access_token && !credentials.long_lived_token)) {
      throw new Error('Instagram access token not found. Please reconnect your Instagram account.');
    }
    
    const accessToken = credentials.long_lived_token || credentials.access_token;
    
    // For Instagram, we need to first get the connected business account
    const accountsResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const accountsData = await accountsResponse.json();
    
    if (!accountsResponse.ok) {
      console.error('Instagram business accounts fetch error:', accountsData);
      throw new Error('Failed to retrieve your Instagram business accounts.');
    }
    
    if (!accountsData.data || accountsData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to have a Facebook page connected to your Instagram business account to post content.');
    }
    
    // Use the first page
    const page = accountsData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    
    // Get Instagram business account ID associated with this page
    const instagramAccountsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
    const instagramAccountsData = await instagramAccountsResponse.json();
    
    if (!instagramAccountsResponse.ok) {
      console.error('Instagram business account fetch error:', instagramAccountsData);
      throw new Error('Failed to retrieve your Instagram business account.');
    }
    
    if (!instagramAccountsData.instagram_business_account) {
      throw new Error('No Instagram business account found. You need to connect your Facebook page to an Instagram business account.');
    }
    
    const igBusinessAccountId = instagramAccountsData.instagram_business_account.id;
    
    // For Instagram, first create a media object
    const createMediaResponse = await fetch(`https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content.content,
        access_token: pageAccessToken
      })
    });
    
    const createMediaData = await createMediaResponse.json();
    
    if (!createMediaResponse.ok) {
      console.error('Instagram media creation error:', createMediaData);
      throw new Error(createMediaData.error?.message || 'Failed to create Instagram media object');
    }
    
    const mediaObjectId = createMediaData.id;
    
    // Then publish the media object
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igBusinessAccountId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: mediaObjectId,
        access_token: pageAccessToken
      })
    });
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('Instagram publish error:', publishData);
      throw new Error(publishData.error?.message || 'Failed to publish to Instagram');
    }
    
    // Update post status
    const { error: updateError } = await supabase.rpc('trigger_instagram_post', { post_id: postId });
    
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
    
    console.log('Successfully posted to Instagram:', publishData);
    
    return new Response(JSON.stringify({
      success: true,
      postId: publishData.id,
      message: 'Posted successfully to Instagram'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to post to Instagram'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
