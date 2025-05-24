
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const requestBody = await req.json();
    const { user_id, frequency, time_of_day, day_of_week, day_of_month, timezone } = requestBody;
    
    console.log('Received update request with params:', { user_id, frequency, time_of_day, timezone });

    // Input validation
    if (!user_id) {
      throw new Error("Missing required parameter: user_id");
    }
    
    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      throw new Error("Invalid frequency parameter. Must be 'daily', 'weekly', or 'monthly'");
    }
    
    if (!time_of_day || !/^\d{2}:\d{2}(:\d{2})?$/.test(time_of_day)) {
      throw new Error("Invalid time_of_day parameter. Must be in format 'HH:MM' or 'HH:MM:SS'");
    }
    
    // Special validation for weekly/monthly
    if (frequency === 'weekly' && (day_of_week === undefined || day_of_week < 0 || day_of_week > 6)) {
      console.warn("Weekly frequency but day_of_week is invalid. Using current day of week");
      requestBody.day_of_week = new Date().getDay();
    }
    
    if (frequency === 'monthly' && (day_of_month === undefined || day_of_month < 1 || day_of_month > 31)) {
      console.warn("Monthly frequency but day_of_month is invalid. Using current day of month");
      requestBody.day_of_month = new Date().getDate();
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, calculate the initial next_run_at time based on settings
    const initialNextRunTime = calculateNextRunTime({
      frequency,
      timeOfDay: time_of_day,
      dayOfWeek: day_of_week,
      dayOfMonth: day_of_month,
      timezone: timezone || 'UTC'
    }, 0);

    // Validate calculated time
    if (!initialNextRunTime || isNaN(initialNextRunTime.getTime())) {
      throw new Error("Failed to calculate a valid initial next run time");
    }

    console.log('Calculated initial next run time for settings:', initialNextRunTime.toISOString());

    // Prepare the settings data with validated next_run_at
    const settingsData = {
      user_id,
      frequency,
      time_of_day,
      day_of_week,
      day_of_month,
      timezone: timezone || 'UTC',
      next_run_at: initialNextRunTime.toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Upserting schedule settings:', settingsData);

    // Update or insert user settings with the new next_run_at time
    const { error: settingsError } = await supabase.from('schedule_settings')
      .upsert(settingsData, {
        onConflict: 'user_id'
      });

    if (settingsError) {
      console.error('Error updating settings:', settingsError);
      throw settingsError;
    }

    console.log('Settings updated successfully');

    try {
      // Get all pending scheduled posts for this user, ordered by creation date
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
        // For the first post (i=0), use offset 0 (starts from initialNextRunTime)
        // For subsequent posts, use the index as offset to spread them across intervals
        const postRunTime = calculateNextRunTime({
          frequency,
          timeOfDay: time_of_day,
          dayOfWeek: day_of_week,
          dayOfMonth: day_of_month,
          timezone: timezone || 'UTC'
        }, i);

        // Validate the calculated time
        if (!postRunTime || isNaN(postRunTime.getTime())) {
          console.error(`Invalid run time calculated for post ${post.id}`);
          continue; // Skip this post rather than failing the entire operation
        }

        const postRunTimeString = postRunTime.toISOString();
        console.log(`Updating post ${post.id} (position ${i}) with next run time: ${postRunTimeString}`);

        // Update the post
        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({
            next_run_at: postRunTimeString,
            timezone: timezone || 'UTC'
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
          // Continue with other posts rather than failing everything
        }
      }

      console.log('All posts updated successfully');

      // After updating all posts, calculate the next available slot for new posts
      // This should be after the last scheduled post
      const nextAvailableSlot = calculateNextRunTime({
        frequency,
        timeOfDay: time_of_day,
        dayOfWeek: day_of_week,
        dayOfMonth: day_of_month,
        timezone: timezone || 'UTC'
      }, pendingPosts?.length || 0);

      // Validate the calculated time
      if (!nextAvailableSlot || isNaN(nextAvailableSlot.getTime())) {
        throw new Error("Failed to calculate a valid next available slot");
      }

      const nextSlotString = nextAvailableSlot.toISOString();
      console.log('Updating settings with next available slot:', nextSlotString);

      // Update settings with the next available slot
      const { error: finalUpdateError } = await supabase
        .from('schedule_settings')
        .update({
          next_run_at: nextSlotString
        })
        .eq('user_id', user_id);

      if (finalUpdateError) {
        console.error('Error updating settings with next available slot:', finalUpdateError);
        throw finalUpdateError;
      }

    } catch (innerError) {
      // Log but don't throw - we want to return success if the settings were updated
      // even if post updating had issues
      console.error('Error updating posts:', innerError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Settings updated successfully",
        next_run_at: initialNextRunTime.toISOString() 
      }),
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
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        stack: error.stack || null 
      }),
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

// Helper function to calculate next run time with robust error handling
function calculateNextRunTime(settings: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}, offset = 0): Date {
  console.log('Calculating next run time with settings:', settings, 'and offset:', offset);
  
  try {
    // Parse the time of day with validation
    let hours = 9, minutes = 0;
    
    if (settings.timeOfDay && typeof settings.timeOfDay === 'string') {
      const timeParts = settings.timeOfDay.split(':');
      if (timeParts.length >= 2) {
        const parsedHours = parseInt(timeParts[0], 10);
        const parsedMinutes = parseInt(timeParts[1], 10);
        
        if (!isNaN(parsedHours) && !isNaN(parsedMinutes) && 
            parsedHours >= 0 && parsedHours <= 23 && 
            parsedMinutes >= 0 && parsedMinutes <= 59) {
          hours = parsedHours;
          minutes = parsedMinutes;
        } else {
          console.warn('Invalid time format:', settings.timeOfDay, 'using default 9:00');
        }
      }
    }
    
    // Start with current time
    const now = new Date();
    let nextRun = new Date();
    
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
        if (settings.dayOfWeek !== undefined && settings.dayOfWeek >= 0 && settings.dayOfWeek <= 6) {
          // Get current day of week (0-6, where 0 is Sunday)
          const currentDay = nextRun.getDay();
          // Calculate days until target day of week
          let daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
          
          // If the target day is today but time has passed, add a week
          if (daysUntilTarget === 0 && nextRun <= now) {
            daysUntilTarget = 7;
          }
          
          // Adjust to the target day
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
          
          // Add offset in weeks
          if (offset > 0) {
            nextRun.setDate(nextRun.getDate() + (offset * 7));
          }
        } else {
          // Invalid day of week, just add offset weeks from today
          nextRun.setDate(nextRun.getDate() + (offset * 7));
        }
        break;
        
      case 'monthly':
        if (settings.dayOfMonth !== undefined && settings.dayOfMonth >= 1 && settings.dayOfMonth <= 31) {
          // Set to the specified day of the current month
          const daysInCurrentMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
          nextRun.setDate(Math.min(settings.dayOfMonth, daysInCurrentMonth));
          
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
        } else {
          // Invalid day of month, just add offset months from today
          nextRun.setMonth(nextRun.getMonth() + offset);
        }
        break;
        
      default:
        // Unknown frequency, default to daily
        nextRun.setDate(nextRun.getDate() + offset);
    }
    
    console.log('Calculated next run time:', nextRun.toISOString());
    
    // Final validation check
    if (isNaN(nextRun.getTime())) {
      console.error('Invalid date calculated:', nextRun);
      // Return a safe default (tomorrow at 9am) if calculation failed
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1 + offset);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Return a safe default (tomorrow at 9am) if calculation failed
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1 + offset);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
  }
}

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
