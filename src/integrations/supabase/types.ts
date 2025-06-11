export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content_ideas: {
        Row: {
          content: string
          created_at: string
          id: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          status: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          mobile_number: string | null
          profile_completed: boolean | null
          provider: string | null
          provider_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          mobile_number?: string | null
          profile_completed?: boolean | null
          provider?: string | null
          provider_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          mobile_number?: string | null
          profile_completed?: boolean | null
          provider?: string | null
          provider_id?: string | null
        }
        Relationships: []
      }
      schedule_settings: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          frequency: Database["public"]["Enums"]["schedule_frequency"]
          id: string
          next_run_at: string
          post_id: string | null
          time_of_day: string
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency: Database["public"]["Enums"]["schedule_frequency"]
          id?: string
          next_run_at: string
          post_id?: string | null
          time_of_day: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: Database["public"]["Enums"]["schedule_frequency"]
          id?: string
          next_run_at?: string
          post_id?: string | null
          time_of_day?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_settings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          content_id: number | null
          created_at: string
          id: string
          next_run_at: string
          platforms: Json | null
          status: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id?: number | null
          created_at?: string
          id?: string
          next_run_at: string
          platforms?: Json | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: number | null
          created_at?: string
          id?: string
          next_run_at?: string
          platforms?: Json | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_period: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_facebook_credentials: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string | null
          expires_at: string | null
          facebook_profile_data: Json | null
          facebook_user_id: string | null
          id: string
          long_lived_token: string | null
          redirect_uri: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string | null
          expires_at?: string | null
          facebook_profile_data?: Json | null
          facebook_user_id?: string | null
          id?: string
          long_lived_token?: string | null
          redirect_uri?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          expires_at?: string | null
          facebook_profile_data?: Json | null
          facebook_user_id?: string | null
          id?: string
          long_lived_token?: string | null
          redirect_uri?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_instagram_credentials: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string | null
          expires_at: string | null
          id: string
          instagram_profile_data: Json | null
          instagram_user_id: string | null
          long_lived_token: string | null
          redirect_uri: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_profile_data?: Json | null
          instagram_user_id?: string | null
          long_lived_token?: string | null
          redirect_uri?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_profile_data?: Json | null
          instagram_user_id?: string | null
          long_lived_token?: string | null
          redirect_uri?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_linkedin_credentials: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string | null
          expires_at: string | null
          id: string
          linkedin_profile_data: Json | null
          linkedin_profile_id: string | null
          redirect_uri: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          linkedin_profile_data?: Json | null
          linkedin_profile_id?: string | null
          redirect_uri?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          linkedin_profile_data?: Json | null
          linkedin_profile_id?: string | null
          redirect_uri?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_linkedin_pages: {
        Row: {
          created_at: string | null
          id: string
          is_selected: boolean | null
          page_data: Json | null
          page_id: string
          page_name: string
          page_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          page_data?: Json | null
          page_id: string
          page_name: string
          page_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          page_data?: Json | null
          page_id?: string
          page_name?: string
          page_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          active_till: string
          created_at: string
          first_login_at: string | null
          id: string
          payment_provider: string | null
          payment_provider_customer_id: string | null
          payment_provider_subscription_id: string | null
          plan_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_till: string
          created_at?: string
          first_login_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_till?: string
          created_at?: string
          first_login_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_customer_id?: string | null
          payment_provider_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_scheduled_posts_inconsistencies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_linkedin_post: {
        Args: { post_id: string }
        Returns: undefined
      }
    }
    Enums: {
      schedule_frequency: "daily" | "weekly" | "monthly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      schedule_frequency: ["daily", "weekly", "monthly"],
    },
  },
} as const
