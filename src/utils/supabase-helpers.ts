import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import type { PostgrestError } from '@supabase/supabase-js';

// Type definitions for better error handling
export type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
};

// Type for content_ideas table
export type ContentIdea = Database['public']['Tables']['content_ideas']['Row'];
export type ContentIdeaInsert = Database['public']['Tables']['content_ideas']['Insert'];
export type ContentIdeaUpdate = Database['public']['Tables']['content_ideas']['Update'];

// Type guard for checking if response has error
export function hasError(result: { error: any }): boolean {
  return result.error !== null && result.error !== undefined;
}

// Type guard to check if data is valid and not null
export function isValidData<T>(data: T | null): data is T {
  return data !== null && data !== undefined;
}

// Type-safe helper for user ID operations
export const asUserId = (id: string): ContentIdea['user_id'] => {
  return id as ContentIdea['user_id'];
};

// Type-safe helper for content ID operations  
export const asContentId = (id: number): ContentIdea['id'] => {
  return id as ContentIdea['id'];
};

// Type-safe helper for status operations
export const asContentStatus = (status: string): ContentIdea['status'] => {
  return status as ContentIdea['status'];
};

// Function to safely get the current user
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Auth error:", error);
      return { user: null, error };
    }
    return { user: data.user, error: null };
  } catch (err) {
    console.error("Unexpected auth error:", err);
    return { user: null, error: err as Error };
  }
}

// Function to safely execute a Supabase function
export async function invokeFunction<T>(functionName: string, payload?: any) {
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: payload,
    });
    
    if (error) {
      console.error(`Function error (${functionName}):`, error);
      return { data: null as unknown as T, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Unexpected function error (${functionName}):`, err);
    return { data: null as unknown as T, error: err as Error };
  }
}

// Type-safe database operation helpers
export const createContentIdea = (data: {
  title: string;
  content: string;
  status: string;
  user_id: string;
  created_at?: string;
  id?: number;
}): ContentIdeaInsert => {
  // Add proper type assertions as needed
  return {
    title: data.title,
    content: data.content,
    status: asContentStatus(data.status),
    user_id: asUserId(data.user_id),
    ...(data.created_at && { created_at: data.created_at }),
    ...(data.id && { id: asContentId(data.id) })
  };
};

// Function to safely insert a content idea
export async function insertContentIdea(data: ContentIdeaInsert) {
  try {
    // For type safety, explicitly cast the insert data to what Supabase expects
    const typedData = data as Database['public']['Tables']['content_ideas']['Insert'];
    
    const { data: result, error } = await supabase
      .from('content_ideas')
      .insert(typedData)
      .select();
    
    if (error) {
      console.error('Error inserting content idea:', error);
      return { data: null, error };
    }
    
    return { data: result, error: null };
  } catch (err) {
    console.error('Unexpected error inserting content idea:', err);
    return { data: null, error: err as Error };
  }
}

// Function to safely update a content idea
export async function updateContent(id: string | number, data: ContentIdeaUpdate): Promise<{ data: any | null, error: any | null }> {
  try {
    // For type safety, explicitly cast the update data to what Supabase expects
    const typedData = data as Database['public']['Tables']['content_ideas']['Update'];
    
    const { data: result, error } = await supabase
      .from('content_ideas')
      .update(typedData)
      .eq('id', id as any)
      .select();
    
    if (error) {
      console.error('Error updating content idea:', error);
      return { data: null, error };
    }
    
    return { data: result, error: null };
  } catch (err) {
    console.error('Unexpected error updating content idea:', err);
    return { data: null, error: err as Error };
  }
}

// Function to safely delete a content idea
export async function deleteContent(id: string | number): Promise<{ data: any | null, error: any | null }> {
  try {
    const { data, error } = await supabase
      .from('content_ideas')
      .delete()
      // Using a type assertion on the ID to match what Supabase expects
      .eq('id', id as any);
    
    if (error) {
      console.error('Error deleting content idea:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error deleting content idea:', err);
    return { data: null, error: err as Error };
  }
}

export const updateContentIdea = (data: {
  content?: string;
  title?: string;
  status?: string;
}): ContentIdeaUpdate => {
  // Use explicit casting to satisfy TypeScript
  const updateData = {} as ContentIdeaUpdate;
  
  if (data.content !== undefined) updateData.content = data.content;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) updateData.status = asContentStatus(data.status);
  
  return updateData;
};
