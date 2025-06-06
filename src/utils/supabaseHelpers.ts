
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Type-safe helper for user ID operations
export const asUserId = (id: string): Database['public']['Tables']['profiles']['Row']['id'] => {
  return id as Database['public']['Tables']['profiles']['Row']['id'];
};

// Type guard to check if data is valid (not null and not an error)
export const isValidData = <T>(data: T | null): data is T => {
  return data !== null && typeof data === 'object' && !('error' in data);
};

// Helper for profile operations
export const profileOperations = {
  async fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, mobile_number')
        .eq('id', asUserId(userId))
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, profileData: {
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    profile_completed?: boolean;
  }) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData as any)
        .eq('id', asUserId(userId));
      
      return { error };
    } catch (error) {
      console.error('Exception updating profile:', error);
      return { error };
    }
  }
};

// Helper for social credentials operations
export const credentialsOperations = {
  facebook: {
    async fetch(userId: string) {
      try {
        const { data, error } = await supabase
          .from('user_facebook_credentials')
          .select('client_id, client_secret, redirect_uri, access_token, long_lived_token, facebook_profile_data')
          .eq('user_id', asUserId(userId))
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching Facebook credentials:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Exception fetching Facebook credentials:', error);
        return null;
      }
    },

    async upsert(userId: string, credentials: {
      client_id: string;
      client_secret: string;
      redirect_uri: string;
    }, isUpdate: boolean = false) {
      try {
        if (isUpdate) {
          const { error } = await supabase
            .from('user_facebook_credentials')
            .update(credentials as any)
            .eq('user_id', asUserId(userId));
          return { error };
        } else {
          const { error } = await supabase
            .from('user_facebook_credentials')
            .insert({
              user_id: asUserId(userId),
              ...credentials
            } as any);
          return { error };
        }
      } catch (error) {
        console.error('Exception upserting Facebook credentials:', error);
        return { error };
      }
    },

    async updateTokens(userId: string, tokenData: {
      access_token?: string | null;
      long_lived_token?: string | null;
      expires_at?: string | null;
      facebook_user_id?: string | null;
      facebook_profile_data?: any | null;
    }) {
      try {
        const { error } = await supabase
          .from('user_facebook_credentials')
          .update(tokenData as any)
          .eq('user_id', asUserId(userId));
        return { error };
      } catch (error) {
        console.error('Exception updating Facebook tokens:', error);
        return { error };
      }
    }
  },

  linkedin: {
    async fetch(userId: string) {
      try {
        const { data, error } = await supabase
          .from('user_linkedin_credentials')
          .select('client_id, client_secret, redirect_uri, access_token, refresh_token, linkedin_profile_data')
          .eq('user_id', asUserId(userId))
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching LinkedIn credentials:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Exception fetching LinkedIn credentials:', error);
        return null;
      }
    },

    async upsert(userId: string, credentials: {
      client_id: string;
      client_secret: string;
      redirect_uri: string;
    }, isUpdate: boolean = false) {
      try {
        if (isUpdate) {
          const { error } = await supabase
            .from('user_linkedin_credentials')
            .update(credentials as any)
            .eq('user_id', asUserId(userId));
          return { error };
        } else {
          const { error } = await supabase
            .from('user_linkedin_credentials')
            .insert({
              user_id: asUserId(userId),
              ...credentials
            } as any);
          return { error };
        }
      } catch (error) {
        console.error('Exception upserting LinkedIn credentials:', error);
        return { error };
      }
    },

    async updateTokens(userId: string, tokenData: {
      access_token?: string | null;
      refresh_token?: string | null;
      expires_at?: string | null;
      linkedin_profile_id?: string | null;
      linkedin_profile_data?: any | null;
    }) {
      try {
        const { error } = await supabase
          .from('user_linkedin_credentials')
          .update(tokenData as any)
          .eq('user_id', asUserId(userId));
        return { error };
      } catch (error) {
        console.error('Exception updating LinkedIn tokens:', error);
        return { error };
      }
    }
  },

  instagram: {
    async fetch(userId: string) {
      try {
        const { data, error } = await supabase
          .from('user_instagram_credentials')
          .select('client_id, client_secret, redirect_uri, access_token, long_lived_token, instagram_profile_data')
          .eq('user_id', asUserId(userId))
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching Instagram credentials:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Exception fetching Instagram credentials:', error);
        return null;
      }
    },

    async upsert(userId: string, credentials: {
      client_id: string;
      client_secret: string;
      redirect_uri: string;
    }, isUpdate: boolean = false) {
      try {
        if (isUpdate) {
          const { error } = await supabase
            .from('user_instagram_credentials')
            .update(credentials as any)
            .eq('user_id', asUserId(userId));
          return { error };
        } else {
          const { error } = await supabase
            .from('user_instagram_credentials')
            .insert({
              user_id: asUserId(userId),
              ...credentials
            } as any);
          return { error };
        }
      } catch (error) {
        console.error('Exception upserting Instagram credentials:', error);
        return { error };
      }
    },

    async updateTokens(userId: string, tokenData: {
      access_token?: string | null;
      long_lived_token?: string | null;
      expires_at?: string | null;
      instagram_user_id?: string | null;
      instagram_profile_data?: any | null;
    }) {
      try {
        const { error } = await supabase
          .from('user_instagram_credentials')
          .update(tokenData as any)
          .eq('user_id', asUserId(userId));
        return { error };
      } catch (error) {
        console.error('Exception updating Instagram tokens:', error);
        return { error };
      }
    }
  }
};
