
-- Add timezone column to schedule_settings if it doesn't exist
ALTER TABLE public.schedule_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add user_id column to schedule_settings to store user default settings
ALTER TABLE public.schedule_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedule_settings_user_id ON public.schedule_settings(user_id);

-- Update RLS policies for user_id column
DROP POLICY IF EXISTS "Allow users to view schedule settings" ON public.schedule_settings;
CREATE POLICY "Allow users to view schedule settings"
ON public.schedule_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert schedule settings" ON public.schedule_settings;
CREATE POLICY "Allow users to insert schedule settings"
ON public.schedule_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update schedule settings" ON public.schedule_settings;
CREATE POLICY "Allow users to update schedule settings"
ON public.schedule_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
