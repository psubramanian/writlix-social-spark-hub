
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { topic, quantity } = await req.json();
    console.log(`Generating ${quantity} content ideas about "${topic}"`);
    
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional LinkedIn content creator. Generate engaging and professional LinkedIn posts about the given topic. Each post should have a title, a short preview, and a full detailed content that includes proper HTML formatting.
            
            Use basic HTML formatting tags like <p>, <strong>, <em>, <ul>, <li>, <h3> for structure and emphasis. Include line breaks with <br> where appropriate.
            
            Format your response as a JSON array with each object having these exact fields:
            - title: A catchy, professional title
            - preview: A 2-3 sentence summary (plain text)
            - content: A full, detailed post with multiple paragraphs formatted with HTML tags
            
            Return ONLY the JSON array with no markdown formatting, code blocks, or additional text.`
          },
          {
            role: 'user',
            content: `Generate ${quantity} LinkedIn posts about "${topic}". Ensure each post is unique, informative, and provides actionable insights.`
          }
        ],
        temperature: 0.7,
      }),
    });

    console.log('OpenAI API response received');
    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response format:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service', details: data }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const content = data.choices[0].message.content;
    console.log('Content received:', content.substring(0, 100) + '...');
    
    try {
      // Clean up the content by removing any markdown code block indicators
      let cleanContent = content;
      
      // Remove markdown code block markers if present
      cleanContent = cleanContent.replace(/```json\s*/g, '');
      cleanContent = cleanContent.replace(/```\s*$/g, '');
      
      // Trim any whitespace
      cleanContent = cleanContent.trim();
      
      console.log('Parsing cleaned JSON content');
      const generatedContent = JSON.parse(cleanContent);
      console.log(`Successfully generated ${generatedContent.length} content items`);
      
      return new Response(JSON.stringify(generatedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse JSON content:', parseError, 'Content sample:', content.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse content from AI service',
          rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
