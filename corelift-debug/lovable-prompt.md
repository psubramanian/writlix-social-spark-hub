# Lovable Prompt: Fix TypeScript Errors

You created this project with relaxed TypeScript settings (strict: false, strictNullChecks: false), but your build environment seems to enforce stricter type checking. Fix the TypeScript errors in the codebase by focusing on the following patterns:

## 1. Add proper error handling for all Supabase operations

- Find all instances where Supabase query results are accessed without error checking
- For each, destructure the response to separate data and error
- Add explicit error handling before accessing properties

```typescript
// Convert this pattern:
const posts = await supabase.from('content_ideas').select();
return posts.map(post => post.id);

// To this pattern:
const { data: posts, error } = await supabase.from('content_ideas').select();
if (error) {
  console.error('Failed to fetch posts:', error);
  return []; // Or appropriate error handling
}
return posts.map(post => post.id);
```

## 2. Fix type mismatches in Supabase filter parameters

- For all `.eq()`, `.neq()`, `.gt()` etc. operations that have type errors
- Add type assertions to ensure the parameter types match what Supabase expects

```typescript
// Replace:
.eq('user_id', userId)

// With:
.eq('user_id', userId as unknown as Database['public']['Tables']['content_ideas']['Row']['user_id'])
```

## 3. Fix object property issues

- In src/contexts/auth/useAuthProvider.tsx:302, remove the 'flowType' property
- For all database insertions/updates, use proper Database types:

```typescript
type ContentIdea = Database['public']['Tables']['content_ideas']['Insert'];
const newRecord: ContentIdea = {
  // Only include valid properties here
};
```

## 4. Create a utility function for safer Supabase operations

```typescript
// Add to src/utils/supabase-helpers.ts

export function safeQuery<T>(
  promise: Promise<{ data: T | null; error: Error | null }>
): Promise<{ data: T | null; error: Error | null }> {
  return promise.catch(err => ({ data: null, error: err }));
}

// Usage:
const { data, error } = await safeQuery(
  supabase.from('content_ideas').select()
);
```

## Priority Files

Focus on these files with errors first:
- src/hooks/useContentGenerate.ts
- src/hooks/useContentOperations.ts
- src/hooks/useDashboardStats.ts
- src/contexts/auth/useAuthProvider.tsx

Maintain all existing functionality while ensuring type safety.
