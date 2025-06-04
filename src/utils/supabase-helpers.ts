
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Type-safe helper for user ID operations
export const asUserId = (id: string): string => {
  return id;
};

// Type-safe helper for content ID operations  
export const asContentId = (id: number): number => {
  return id;
};

// Type-safe helper for status operations
export const asContentStatus = (status: string): string => {
  return status;
};

// Helper function for safer Supabase operations
export function safeQuery<T>(
  promise: Promise<{ data: T | null; error: any | null }>
): Promise<{ data: T | null; error: any | null }> {
  return promise.catch(err => ({ data: null, error: err }));
}

// Type guard to check if data is valid (not null and not an error)
export const isValidData = <T>(data: T | null): data is T => {
  return data !== null && typeof data === 'object' && !('error' in data);
};

// Type-safe database operation helpers
export const createContentIdea = (data: {
  title: string;
  content: string;
  status: string;
  user_id: string;
}): Database['public']['Tables']['content_ideas']['Insert'] => {
  return {
    title: data.title,
    content: data.content,
    status: data.status,
    user_id: data.user_id
  };
};

export const updateContentIdea = (data: {
  content?: string;
  title?: string;
  status?: string;
}): Database['public']['Tables']['content_ideas']['Update'] => {
  const updateData: Database['public']['Tables']['content_ideas']['Update'] = {};
  
  if (data.content !== undefined) updateData.content = data.content;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) updateData.status = data.status;
  
  return updateData;
};
