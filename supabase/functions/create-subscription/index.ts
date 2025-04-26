
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      .eq('name', 'PRO')
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
    
    // Create a Razorpay subscription plan (or use an existing one)
    // Ideally, you'd create plans in the Razorpay dashboard and reference them here
    console.log(`Creating Razorpay subscription with amount: ${amountInPaise}`)
    
    // Create a subscription directly (simplified for this example)
    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
      },
      body: JSON.stringify({
        plan_id: 'plan_monthly_pro', // You'll need to create this in Razorpay dashboard first
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 12 months
        notes: {
          user_id: user_id
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Razorpay API error:', errorText)
      throw new Error(`Razorpay API error: ${response.status} ${errorText}`)
    }

    const subscriptionData = await response.json()
    console.log('Subscription created:', subscriptionData.id)

    // Add key_id to the response so frontend can use it
    subscriptionData.key_id = RAZORPAY_KEY_ID

    return new Response(
      JSON.stringify(subscriptionData),
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
        error: error.message || 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
