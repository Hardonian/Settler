/**
 * Supabase Database Types
 * 
 * CTO Mode: Type Safety
 * - Generated from Supabase schema
 * - Use these types instead of 'any'
 * - Run: supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
 * 
 * TODO: Generate actual types from Supabase schema
 * For now, this is a placeholder structure
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_tenant_id: string | null;
          tier: string;
          status: string;
          quotas: Json;
          config: Json;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          email: string;
          password_hash: string;
          name: string | null;
          role: string;
          data_residency_region: string;
          data_retention_days: number;
          deleted_at: string | null;
          deletion_scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>;
      };
      // Ecosystem tables
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: string;
          impact_score: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          impact_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          impact_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          post_type: string;
          status: string;
          views: number;
          upvotes: number;
          downvotes: number;
          comments_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          activity_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          activity_type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      positioning_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          five_word_vp: string | null;
          target_persona_pain: string | null;
          clarity_rating: number | null;
          feedback_text: string | null;
          impact_score: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          five_word_vp?: string | null;
          target_persona_pain?: string | null;
          clarity_rating?: number | null;
          feedback_text?: string | null;
          impact_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          five_word_vp?: string | null;
          target_persona_pain?: string | null;
          clarity_rating?: number | null;
          feedback_text?: string | null;
          impact_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string | null;
          entity_type: string | null;
          entity_id: string | null;
          read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      // Add other tables as needed
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      kpi_new_users_week: {
        Row: {
          count: number;
        };
        Insert: never;
        Update: never;
      };
      kpi_actions_last_hour: {
        Row: {
          count: number;
        };
        Insert: never;
        Update: never;
      };
      kpi_most_engaged_post_today: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          views: number;
          upvotes: number;
          total_engagement: number;
        };
        Insert: never;
        Update: never;
      };
      kpi_health_status: {
        Row: {
          new_users_week: number;
          actions_last_hour: number;
          top_post_engagement: number;
          all_cylinders_firing: boolean;
        };
        Insert: never;
        Update: never;
      };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: never;
        Update: never;
      };
    };
    Functions: {
      get_kpi_health_status: {
        Args: Record<string, never>;
        Returns: {
          new_users_week: number;
          actions_last_hour: number;
          top_post_engagement: number;
          all_cylinders_firing: boolean;
        };
      };
      calculate_positioning_impact_score: {
        Args: {
          p_feedback_id: string;
        };
        Returns: number;
      };
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}
