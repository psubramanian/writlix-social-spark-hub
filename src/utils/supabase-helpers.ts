
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Type-safe helper for user ID operations
export const asUserId = (id: string): Database['public']['Tables']['profiles']['Row']['id'] => {
  return id as Database['public']['Tables']['profiles']['Row']['id'];
};

// Type-safe helper for content ID operations
export const asContentId = (id: number): Database['public']['Tables']['content_ideas']['Row']['id'] => {
  return id as Database['public']['Tables']['content_ideas']['Row']['id'];
};

// Type-safe helper for status operations
export const asContentStatus = (status: string): Database['public']['Tables']['content_ideas']['Row']['status'] => {
  return status as Database['public']['Tables']['content_ideas']['Row']['status'];
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
