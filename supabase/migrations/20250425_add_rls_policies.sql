
-- Enable Row Level Security for content_ideas table
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own content
CREATE POLICY "Allow users to insert own content" 
ON public.content_ideas
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow authenticated users to view their own content
CREATE POLICY "Allow users to view own content"
ON public.content_ideas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow authenticated users to update their own content
CREATE POLICY "Allow users to update own content"
ON public.content_ideas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow authenticated users to delete their own content
CREATE POLICY "Allow users to delete own content"
ON public.content_ideas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
