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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
        Insert: Omit<
          Database["public"]["Tables"]["tenants"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["activity_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["posts"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      project_snapshots: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          project_type: string;
          snapshot_name: string;
          snapshot_data: Json;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_snapshots"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["project_snapshots"]["Insert"]>;
      };
      canned_responses: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: string;
          tags: string[] | null;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["canned_responses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["canned_responses"]["Insert"]>;
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          description: string | null;
          category: string | null;
          severity: string;
          status: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["support_tickets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
      };
      user_checklist: {
        Row: {
          id: string;
          user_id: string;
          checklist_item: string;
          completed: boolean;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_checklist"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_checklist"]["Insert"]>;
      };
      integration_credentials: {
        Row: {
          id: string;
          user_id: string;
          integration_id: string;
          credentials: Json;
          is_connected: boolean;
          last_sync_at: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["integration_credentials"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["integration_credentials"]["Insert"]>;
      };
      reconciliation_jobs: {
        Row: {
          id: string;
          user_id: string;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_user_id: string;
          referral_code: string;
          status: string;
          referred_user_id: string | null;
          reward_amount: number | null;
          reward_currency: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
      };
      user_segments: {
        Row: {
          id: string;
          user_id: string;
          segment_type: string;
          segment_name: string;
          segment_metadata: Json;
          assigned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_segments"]["Row"], "id" | "assigned_at">;
        Update: Partial<Database["public"]["Tables"]["user_segments"]["Insert"]>;
      };
      user_lifecycle: {
        Row: {
          id: string;
          user_id: string;
          current_stage: string;
          activated_at: string | null;
          total_jobs_created: number;
          usage_percentage: number;
          active_last_7_days: boolean;
          active_days_last_30: number;
          has_upgraded: boolean;
          using_premium_features: boolean;
          churn_risk_score: number | null;
          churn_risk_reasons: string[] | null;
          expansion_opportunity_score: number | null;
          days_since_last_activity: number;
          explicitly_cancelled: boolean;
          has_payment_issues: boolean;
          integration_count: number;
          viewed_enterprise_features: boolean;
          first_successful_setup_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_lifecycle"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_lifecycle"]["Insert"]>;
      };
      email_sequences: {
        Row: {
          id: string;
          user_id: string;
          sequence_type: string;
          delay_hours: number;
          template_id: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["email_sequences"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["email_sequences"]["Insert"]>;
      };
      email_sends: {
        Row: {
          id: string;
          user_id: string;
          sequence_id: string | null;
          template_id: string | null;
          email_address: string;
          subject: string;
          status: string;
          metadata: Json;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["email_sends"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["email_sends"]["Insert"]>;
      };
      escalation_rules: {
        Row: {
          id: string;
          name: string;
          trigger_condition: Json;
          action: string;
          target_user_id: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["escalation_rules"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["escalation_rules"]["Insert"]>;
      };
      escalation_history: {
        Row: {
          id: string;
          ticket_id: string;
          rule_id: string;
          from_user_id: string | null;
          to_user_id: string | null;
          reason: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["escalation_history"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["escalation_history"]["Insert"]>;
      };
      alerts: {
        Row: {
          id: string;
          alert_type: string;
          severity: string;
          title: string;
          component: string;
          metadata: Json;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
      affiliate_programs: {
        Row: {
          id: string;
          user_id: string;
          referral_code: string;
          commission_rate: number;
          total_revenue: number;
          total_payouts: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliate_programs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["affiliate_programs"]["Insert"]>;
      };
      affiliate_conversions: {
        Row: {
          id: string;
          affiliate_id: string;
          user_id: string;
          conversion_type: string;
          revenue_amount: number;
          commission_amount: number;
          status: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliate_conversions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["affiliate_conversions"]["Insert"]>;
      };
      reconciliation_reports: {
        Row: {
          id: string;
          integration_id: string;
          amount: number;
          failure_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reconciliation_reports"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reconciliation_reports"]["Insert"]>;
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
