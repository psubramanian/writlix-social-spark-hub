
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Type guard to check if the response is successful and has data
export function isSuccessfulResponse<T>(response: PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> & { data: T } {
  return response.error === null && response.data !== null;
}

// Type guard to check if data exists (not null/undefined)
export function hasData<T>(data: T | null | undefined): data is T {
  return data !== null && data !== undefined;
}

// Safe property access for query results
export function safeAccess<T, K extends keyof T>(obj: any, key: K): T[K] | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  return obj[key];
}

// Flexible type assertion helper for database IDs - removes strict typing
export function toDbId(value: string | number): string {
  return String(value);
}

// Flexible type assertion helper for database update objects - removes strict typing
export function toDbUpdate(obj: Record<string, any>): Record<string, any> {
  return obj;
}

// Flexible type assertion helper for database insert objects - removes strict typing
export function toDbInsert(obj: Record<string, any>): Record<string, any> {
  return obj;
}
