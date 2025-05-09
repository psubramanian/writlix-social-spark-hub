
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { UserProfile } from "@/types/auth";

export interface ExtendedUser extends SupabaseUser {
  name?: string;
  avatar?: string;
  linkedInConnected?: boolean;
  profileComplete?: boolean;
}

export interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (provider: 'google' | 'linkedin_oidc') => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<any>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
  getAuthDebugInfo: () => any;
}
