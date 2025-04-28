
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { user_id, frequency, time_of_day, day_of_week, day_of_month, timezone } = await req.json();
    console.log('Received update request with params:', { user_id, frequency, time_of_day, timezone });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, update or insert user settings
    const { error: settingsError } = await supabase.from('schedule_settings')
      .upsert({
        user_id,
        frequency,
        time_of_day,
        day_of_week,
        day_of_month,
        timezone,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (settingsError) {
      console.error('Error updating settings:', settingsError);
      throw settingsError;
    }

    console.log('Settings updated successfully');

    // Get all pending scheduled posts for this user
    const { data: pendingPosts, error: postsError } = await supabase
      .from('scheduled_posts')
      .select('id, created_at')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (postsError) {
      console.error('Error fetching pending posts:', postsError);
      throw postsError;
    }

    console.log(`Found ${pendingPosts?.length || 0} pending posts to update`);

    // Update all pending posts with new scheduling
    for (let i = 0; i < (pendingPosts?.length || 0); i++) {
      const post = pendingPosts[i];
      
      // Calculate next run time based on post position and new settings
      const nextRunTime = calculateNextRunTime({
        frequency,
        timeOfDay: time_of_day,
        dayOfWeek: day_of_week,
        dayOfMonth: day_of_month,
        timezone: timezone || 'UTC'
      }, i);

      console.log(`Updating post ${post.id} with next run time: ${nextRunTime.toISOString()}`);

      // Update the post
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          next_run_at: nextRunTime.toISOString(),
          timezone: timezone || 'UTC'
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
        throw updateError;
      }
    }

    console.log('All posts updated successfully');

    return new Response(
      JSON.stringify({ success: true, updatedPostsCount: pendingPosts?.length || 0 }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        } 
      }
    );

  } catch (error) {
    console.error('Error in update-user-schedule-settings:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});

// Helper function to calculate next run time
function calculateNextRunTime(settings: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}, offset = 0): Date {
  console.log('Calculating next run time with settings:', settings, 'and offset:', offset);
  
  // Parse the time of day
  const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
  
  // Start with current time in the user's timezone
  const now = new Date();
  let nextRun = new Date(now.getTime());
  
  // Set the time components
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  // Apply frequency specific adjustments
  switch (settings.frequency) {
    case 'daily':
      // For daily, simply add the offset in days
      nextRun.setDate(nextRun.getDate() + offset);
      break;
      
    case 'weekly':
      if (settings.dayOfWeek !== undefined) {
        // Get current day of week (0-6, where 0 is Sunday)
        const currentDay = nextRun.getDay();
        // Calculate days until target day of week
        const daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
        // Adjust date to the target day of week, then add offset weeks
        nextRun.setDate(nextRun.getDate() + daysUntilTarget + (offset * 7));
      }
      break;
      
    case 'monthly':
      if (settings.dayOfMonth !== undefined) {
        // Set to the specified day of the current month
        nextRun.setDate(Math.min(settings.dayOfMonth, getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1)));
        
        // If this date is in the past, move to next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        
        // Add offset months
        if (offset > 0) {
          nextRun.setMonth(nextRun.getMonth() + offset);
        }
      }
      break;
  }
  
  console.log('Calculated next run time:', nextRun.toISOString());
  return nextRun;
}

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
