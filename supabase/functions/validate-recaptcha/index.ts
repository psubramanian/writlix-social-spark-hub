
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
};

// Validate reCAPTCHA token by calling Google's API
const validateReCAPTCHA = async (token: string, secretKey: string): Promise<boolean> => {
  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();
    console.log("reCAPTCHA validation response:", data);

    // Return whether the validation was successful
    return data.success === true;
  } catch (error) {
    console.error("Error validating reCAPTCHA:", error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { token } = await req.json();

    // Validate inputs
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing reCAPTCHA token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get reCAPTCHA secret key from environment variables
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not set");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate reCAPTCHA token
    const isValid = await validateReCAPTCHA(token, secretKey);
    
    if (isValid) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'reCAPTCHA verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      
    });
  }
});
