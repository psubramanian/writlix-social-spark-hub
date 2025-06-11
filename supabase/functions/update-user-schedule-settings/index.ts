
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

    // First, get all pending scheduled posts for this user, ordered by creation date
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

    // Calculate initial next run time based on settings
    const initialNextRunTime = calculateNextRunTime({
      frequency,
      timeOfDay: time_of_day,
      dayOfWeek: day_of_week,
      dayOfMonth: day_of_month,
      timezone: timezone || 'UTC'
    }, 0);

    // Update settings with the initial time
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

    const { error: settingsError } = await supabase.from('schedule_settings')
      .upsert(settingsData, {
        onConflict: 'user_id'
      });

    if (settingsError) {
      console.error('Error updating settings:', settingsError);
      throw settingsError;
    }

    console.log('Settings updated successfully');

    // Update all pending posts with new scheduling (consecutive dates)
    for (let i = 0; i < (pendingPosts?.length || 0); i++) {
      const post = pendingPosts[i];
      
      // Calculate next run time for each post with proper offset
      const postRunTime = calculateNextRunTime({
        frequency,
        timeOfDay: time_of_day,
        dayOfWeek: day_of_week,
        dayOfMonth: day_of_month,
        timezone: timezone || 'UTC'
      }, i); // Use index as offset for consecutive scheduling

      // Validate the calculated time
      if (!postRunTime || isNaN(postRunTime.getTime())) {
        console.error(`Invalid run time calculated for post ${post.id}`);
        continue;
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
      }
    }

    // Calculate the next available slot for new posts
    const nextAvailableSlot = calculateNextRunTime({
      frequency,
      timeOfDay: time_of_day,
      dayOfWeek: day_of_week,
      dayOfMonth: day_of_month,
      timezone: timezone || 'UTC'
    }, pendingPosts?.length || 0);

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

    console.log('All posts updated successfully with consecutive scheduling');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Settings updated successfully",
        next_run_at: initialNextRunTime.toISOString(),
        updatedPostsCount: pendingPosts?.length || 0
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

// Helper function to calculate next run time
function calculateNextRunTime(settings: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}, offset = 0): Date {
  console.log('Edge function - Calculating next run time with settings:', settings, 'and offset:', offset);
  
  try {
    // Parse the time of day
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
        }
      }
    }
    
    // Start with current time
    const now = new Date();
    let nextRun = new Date();
    
    // Set the time components
    nextRun.setHours(hours, minutes, 0, 0);
    
    // For the first post (offset 0), if time has passed today, use tomorrow
    if (offset === 0 && nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // Apply frequency and offset
    switch (settings.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + offset);
        console.log(`Daily: Added ${offset} days, result:`, nextRun.toISOString());
        break;
        
      case 'weekly':
        if (settings.dayOfWeek !== undefined && settings.dayOfWeek >= 0 && settings.dayOfWeek <= 6) {
          if (offset === 0) {
            // First post: find next occurrence of target day
            const currentDay = nextRun.getDay();
            let daysUntilTarget = (settings.dayOfWeek - currentDay + 7) % 7;
            if (daysUntilTarget === 0 && nextRun <= now) {
              daysUntilTarget = 7;
            }
            nextRun.setDate(nextRun.getDate() + daysUntilTarget);
          } else {
            // Subsequent posts: add weeks
            nextRun.setDate(nextRun.getDate() + (offset * 7));
          }
        } else {
          nextRun.setDate(nextRun.getDate() + (offset * 7));
        }
        console.log(`Weekly: offset ${offset}, result:`, nextRun.toISOString());
        break;
        
      case 'monthly':
        if (settings.dayOfMonth !== undefined && settings.dayOfMonth >= 1 && settings.dayOfMonth <= 31) {
          if (offset === 0) {
            // First post: find next occurrence of target day
            const daysInMonth = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, daysInMonth));
            if (nextRun <= now) {
              nextRun.setMonth(nextRun.getMonth() + 1);
              const nextMonthDays = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
              nextRun.setDate(Math.min(settings.dayOfMonth, nextMonthDays));
            }
          } else {
            // Subsequent posts: add months
            nextRun.setMonth(nextRun.getMonth() + offset);
            const futureMonthDays = getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth() + 1);
            nextRun.setDate(Math.min(settings.dayOfMonth, futureMonthDays));
          }
        } else {
          nextRun.setMonth(nextRun.getMonth() + offset);
        }
        console.log(`Monthly: offset ${offset}, result:`, nextRun.toISOString());
        break;
        
      default:
        nextRun.setDate(nextRun.getDate() + offset);
    }
    
    console.log('Edge function - Final calculated time:', nextRun.toISOString());
    
    if (isNaN(nextRun.getTime())) {
      console.error('Invalid date calculated:', nextRun);
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1 + offset);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
    }
    
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1 + offset);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
