
CREATE OR REPLACE FUNCTION public.update_user_schedule_settings(
  p_user_id UUID,
  p_frequency schedule_frequency,
  p_time_of_day TIME,
  p_day_of_week INTEGER DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_run timestamp with time zone;
  v_post record;
  v_offset integer;
BEGIN
  -- Update or insert user settings
  INSERT INTO public.schedule_settings (
    user_id,
    frequency,
    time_of_day,
    day_of_week,
    day_of_month,
    timezone
  ) VALUES (
    p_user_id,
    p_frequency,
    p_time_of_day,
    p_day_of_week,
    p_day_of_month,
    p_timezone
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    frequency = EXCLUDED.frequency,
    time_of_day = EXCLUDED.time_of_day,
    day_of_week = EXCLUDED.day_of_week,
    day_of_month = EXCLUDED.day_of_month,
    timezone = EXCLUDED.timezone,
    updated_at = now();

  -- Update all pending scheduled posts
  FOR v_post IN 
    SELECT id, created_at
    FROM scheduled_posts
    WHERE user_id = p_user_id
      AND status = 'pending'
    ORDER BY created_at ASC
  LOOP
    -- Calculate offset based on post position
    SELECT COUNT(*) - 1 INTO v_offset
    FROM scheduled_posts
    WHERE user_id = p_user_id
      AND created_at <= v_post.created_at
      AND status = 'pending';

    -- Calculate next run time using the new settings
    v_next_run := (
      CASE p_frequency
        WHEN 'daily' THEN
          now() + (v_offset || ' days')::interval
        WHEN 'weekly' THEN
          now() + (v_offset * 7 || ' days')::interval
        WHEN 'monthly' THEN
          now() + (v_offset || ' months')::interval
      END
    )::timestamp with time zone;

    -- Set time of day and adjust for timezone
    v_next_run := date_trunc('day', v_next_run AT TIME ZONE p_timezone) + p_time_of_day::interval;

    -- Adjust for day of week/month if specified
    IF p_frequency = 'weekly' AND p_day_of_week IS NOT NULL THEN
      v_next_run := v_next_run + ((p_day_of_week - EXTRACT(DOW FROM v_next_run))::integer || ' days')::interval;
    ELSIF p_frequency = 'monthly' AND p_day_of_month IS NOT NULL THEN
      v_next_run := date_trunc('month', v_next_run) + ((p_day_of_month - 1) || ' days')::interval + p_time_of_day::interval;
    END IF;

    -- Update the post's next run time
    UPDATE scheduled_posts
    SET next_run_at = v_next_run,
        timezone = p_timezone
    WHERE id = v_post.id;
  END LOOP;
END;
$$;

-- Add RLS policy to allow users to execute this function
GRANT EXECUTE ON FUNCTION public.update_user_schedule_settings TO authenticated;
