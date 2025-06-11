
-- Create table to store LinkedIn pages (personal profile and company pages)
CREATE TABLE IF NOT EXISTS public.user_linkedin_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('personal', 'company')),
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  page_data JSONB,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Add RLS policies
ALTER TABLE public.user_linkedin_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own LinkedIn pages" ON public.user_linkedin_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LinkedIn pages" ON public.user_linkedin_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn pages" ON public.user_linkedin_pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn pages" ON public.user_linkedin_pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_user_linkedin_pages_updated_at
BEFORE UPDATE ON public.user_linkedin_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
