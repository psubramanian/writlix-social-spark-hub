
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify keys are available
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are not configured')
    }

    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    console.log(`Creating subscription for user: ${user_id}`)

    // Get plan details from database
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', 'PRO Plan')
      .single()
      
    if (planError || !planData) {
      console.error('Plan fetch error:', planError)
      throw new Error('Could not find subscription plan')
    }

    // Get user details to use for customer info
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()
      
    if (userError) {
      console.error('User fetch error:', userError)
    }
    
    // Calculate amount in paise/cents (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(planData.price * 100)
    const currency = 'INR' // Currency can be configurable based on user's location
    
    console.log(`Creating Razorpay subscription with amount: ${amountInPaise} ${currency}`)

    // Check if user already has a subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (subError) {
      console.error('Error checking existing subscription:', subError)
    }

    // If no subscription exists, create one
    if (!existingSubscription) {
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user_id,
          status: 'trial',
          active_till: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7-day trial
        });
        
      if (insertError) {
        console.error('Error creating subscription record:', insertError);
      }
    }
    
    // Create a one-time order for the subscription payment
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency,
        receipt: `order_rcpt_${user_id.substring(0, 8)}`,
        notes: {
          user_id: user_id,
          plan_name: planData.name,
          plan_id: planData.id
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Razorpay API error:', errorText)
      throw new Error(`Razorpay API error: ${response.status} ${errorText}`)
    }

    const orderData = await response.json()
    console.log('Order created:', orderData.id)

    // Add key_id and currency to the response so frontend can use it
    orderData.key_id = RAZORPAY_KEY_ID
    orderData.currency = currency

    return new Response(
      JSON.stringify(orderData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
