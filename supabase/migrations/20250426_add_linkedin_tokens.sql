
-- Create a table for storing LinkedIn OAuth tokens
CREATE TABLE IF NOT EXISTS public.user_linkedin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  linkedin_profile_id TEXT,
  linkedin_profile_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for security
ALTER TABLE public.user_linkedin_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to only see, update, and delete their own tokens
CREATE POLICY "Users can view their own tokens" ON public.user_linkedin_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" ON public.user_linkedin_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON public.user_linkedin_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" ON public.user_linkedin_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_user_linkedin_tokens_updated_at
BEFORE UPDATE ON public.user_linkedin_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to ensure only one token per user
CREATE UNIQUE INDEX IF NOT EXISTS user_linkedin_tokens_user_id_idx ON public.user_linkedin_tokens (user_id);
