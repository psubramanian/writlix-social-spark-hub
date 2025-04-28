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

    // First, calculate the new next_run_at time based on settings
    const nextRunTime = calculateNextRunTime({
      frequency,
      timeOfDay: time_of_day,
      dayOfWeek: day_of_week,
      dayOfMonth: day_of_month,
      timezone: timezone || 'UTC'
    });

    console.log('Calculated next run time for settings:', nextRunTime.toISOString());

    // Update or insert user settings with the new next_run_at time
    const { error: settingsError } = await supabase.from('schedule_settings')
      .upsert({
        user_id,
        frequency,
        time_of_day,
        day_of_week,
        day_of_month,
        timezone,
        next_run_at: nextRunTime.toISOString(),
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
      const postRunTime = calculateNextRunTime({
        frequency,
        timeOfDay: time_of_day,
        dayOfWeek: day_of_week,
        dayOfMonth: day_of_month,
        timezone: timezone || 'UTC'
      }, i);

      console.log(`Updating post ${post.id} with next run time: ${postRunTime.toISOString()}`);

      // Update the post
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          next_run_at: postRunTime.toISOString(),
          timezone: timezone || 'UTC'
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
        throw updateError;
      }
    }

    console.log('All posts updated successfully');

    // After updating all posts, update the settings with the next available slot
    const nextAvailableSlot = calculateNextRunTime({
      frequency,
      timeOfDay: time_of_day,
      dayOfWeek: day_of_week,
      dayOfMonth: day_of_month,
      timezone: timezone || 'UTC'
    }, pendingPosts?.length || 0);

    console.log('Updating settings with next available slot:', nextAvailableSlot.toISOString());

    // Update settings with the next available slot
    const { error: finalUpdateError } = await supabase
      .from('schedule_settings')
      .update({
        next_run_at: nextAvailableSlot.toISOString()
      })
      .eq('user_id', user_id);

    if (finalUpdateError) {
      console.error('Error updating settings with next available slot:', finalUpdateError);
      throw finalUpdateError;
    }

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

// Helper function to calculate next run time (same as in scheduleUtils.ts)
function calculateNextRunTime(settings: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}, offset = 0): Date {
  console.log('Calculating next run time with settings:', settings, 'and offset:', offset);
  
  try {
    // Parse the time of day
    const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
    
    // Start with current time
    const now = new Date();
    let nextRun = new Date();
    
    // Set the time components
    nextRun.setHours(hours || 9, minutes || 0, 0, 0);
    
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
          
          // If the target day is today but time has passed, add a week
          if (daysUntilTarget === 0 && nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 7);
          } else {
            // Otherwise adjust to the target day
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
          }
          
          // Add offset in weeks
          if (offset > 0) {
            nextRun.setDate(nextRun.getDate() + (offset * 7));
          }
        }
        break;
        
      case 'monthly':
        if (settings.dayOfMonth !== undefined) {
          // Set to the specified day of the current month
          const currentDate = nextRun.getDate();
          const daysInMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
          nextRun.setDate(Math.min(settings.dayOfMonth, daysInMonth));
          
          // If this date is in the past, move to next month
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            const nextMonthDays = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, nextMonthDays));
          }
          
          // Add offset months
          if (offset > 0) {
            nextRun.setMonth(nextRun.getMonth() + offset);
            const futureMonthDays = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, futureMonthDays));
          }
        }
        break;
    }
    
    console.log('Calculated next run time:', nextRun.toISOString());
    
    // Validate date before returning
    if (isNaN(nextRun.getTime())) {
      console.error('Invalid date calculated:', nextRun);
      // Return a safe default (tomorrow at 9am) if calculation failed
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Return a safe default (tomorrow at 9am) if calculation failed
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
  }
}

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
