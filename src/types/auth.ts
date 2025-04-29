
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string | null;
  email?: string | null;
  provider?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profile_completed?: boolean; // Add this field to track profile completion in the database
  _fallback?: boolean; // Added this property to indicate a fallback profile created client-side
}

export interface ExtendedUser extends User {
  name?: string;
  avatar?: string | null;
  linkedInConnected?: boolean;
  profileComplete?: boolean;
}
