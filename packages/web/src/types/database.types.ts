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
          pre_test_completed?: boolean;
          pre_test_answers?: Json;
          industry?: string;
          company_name?: string;
          plan_type?: string;
          trial_end_date?: string;
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
          pre_test_completed?: boolean;
          pre_test_answers?: Json;
          industry?: string;
          company_name?: string;
          plan_type?: string;
          trial_end_date?: string;
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
          pre_test_completed?: boolean;
          pre_test_answers?: Json;
          industry?: string;
          company_name?: string;
          plan_type?: string;
          trial_end_date?: string;
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
      // Add other tables as needed
      affiliate_programs: {
        Row: {
          id: string;
          referral_code: string;
          status: string;
          commission_rate?: number;
          total_revenue?: number;
          total_payouts?: number;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          referral_code: string;
          status: string;
          commission_rate?: number;
          total_revenue?: number;
          total_payouts?: number;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          referral_code?: string;
          status?: string;
          commission_rate?: number;
          total_revenue?: number;
          total_payouts?: number;
          updated_at?: string;
          [key: string]: unknown;
        };
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
          paid_at?: string | null;
          created_at?: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          affiliate_id: string;
          user_id: string;
          conversion_type: string;
          revenue_amount: number;
          commission_amount: number;
          status: string;
          paid_at?: string | null;
          created_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          affiliate_id?: string;
          user_id?: string;
          conversion_type?: string;
          revenue_amount?: number;
          commission_amount?: number;
          status?: string;
          paid_at?: string | null;
          [key: string]: unknown;
        };
      };
      user_segments: {
        Row: {
          id: string;
          user_id: string;
          segment_type: string;
          segment_name: string;
          segment_metadata: Json;
          assigned_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          segment_type: string;
          segment_name: string;
          segment_metadata?: Json;
          assigned_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          segment_type?: string;
          segment_name?: string;
          segment_metadata?: Json;
          assigned_at?: string;
          [key: string]: unknown;
        };
      };
      email_templates: {
        Row: {
          id: string;
          sequence_id: string;
          subject: string;
          delay_hours?: number;
          order_index?: number;
          enabled?: boolean;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          subject: string;
          delay_hours?: number;
          order_index?: number;
          enabled?: boolean;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          sequence_id?: string;
          subject?: string;
          delay_hours?: number;
          order_index?: number;
          enabled?: boolean;
          [key: string]: unknown;
        };
      };
      user_email_preferences: {
        Row: {
          id: string;
          user_id: string;
          onboarding_emails?: boolean;
          upgrade_prompts?: boolean;
          churn_save_emails?: boolean;
          marketing_emails?: boolean;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          onboarding_emails?: boolean;
          upgrade_prompts?: boolean;
          churn_save_emails?: boolean;
          marketing_emails?: boolean;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          onboarding_emails?: boolean;
          upgrade_prompts?: boolean;
          churn_save_emails?: boolean;
          marketing_emails?: boolean;
          [key: string]: unknown;
        };
      };
      email_sends: {
        Row: {
          id: string;
          user_id: string;
          sequence_id: string;
          template_id: string;
          email_address: string;
          subject: string;
          status: string;
          metadata: Json;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          sequence_id: string;
          template_id: string;
          email_address: string;
          subject: string;
          status: string;
          metadata?: Json;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          sequence_id?: string;
          template_id?: string;
          email_address?: string;
          subject?: string;
          status?: string;
          metadata?: Json;
          [key: string]: unknown;
        };
      };
      user_milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_type: string;
          milestone_data: Json;
          created_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_type: string;
          milestone_data?: Json;
          created_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          milestone_type?: string;
          milestone_data?: Json;
          created_at?: string;
          [key: string]: unknown;
        };
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
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          project_type: string;
          snapshot_name: string;
          snapshot_data?: Json;
          created_by: string;
          created_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          project_type?: string;
          snapshot_name?: string;
          snapshot_data?: Json;
          created_by?: string;
          created_at?: string;
          [key: string]: unknown;
        };
      };
      canned_responses: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          usage_count?: number;
          created_at?: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          usage_count?: number;
          created_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          usage_count?: number;
          created_at?: string;
          [key: string]: unknown;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          description?: string;
          category?: string;
          severity: string;
          status: string;
          assigned_to?: string | null;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          description?: string;
          category?: string;
          severity?: string;
          status?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          description?: string;
          category?: string;
          severity?: string;
          status?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
      };
      user_checklist: {
        Row: {
          id: string;
          user_id: string;
          checklist_item: string;
          completed: boolean;
          completed_at?: string | null;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          checklist_item: string;
          completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          checklist_item?: string;
          completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
          [key: string]: unknown;
        };
      };
      user_lifecycle: {
        Row: {
          id: string;
          user_id: string;
          current_stage?: string;
          churn_risk_score?: number;
          churn_risk_reasons?: Json;
          first_successful_setup_at?: string | null;
          activated_at?: string | null;
          expansion_opportunity_score?: number;
          segment?: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_stage?: string;
          churn_risk_score?: number;
          churn_risk_reasons?: Json;
          first_successful_setup_at?: string | null;
          activated_at?: string | null;
          expansion_opportunity_score?: number;
          segment?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_stage?: string;
          churn_risk_score?: number;
          churn_risk_reasons?: Json;
          first_successful_setup_at?: string | null;
          activated_at?: string | null;
          expansion_opportunity_score?: number;
          segment?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
      };
      ai_analysis_usage: {
        Row: {
          tenant_id: string;
          period_start: string;
          tokens_used: number;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          period_start: string;
          tokens_used: number;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          period_start?: string;
          tokens_used?: number;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          tenant_id: string;
          severity: string;
          title: string;
          message: string;
          source_id: string | null;
          alert_type: string | null;
          threshold_value: number | null;
          actual_value: number | null;
          acknowledged: boolean;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          severity: string;
          title: string;
          message: string;
          source_id?: string | null;
          alert_type?: string | null;
          threshold_value?: number | null;
          actual_value?: number | null;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          severity?: string;
          title?: string;
          message?: string;
          source_id?: string | null;
          alert_type?: string | null;
          threshold_value?: number | null;
          actual_value?: number | null;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
        };
      };
      feature_flags: {
        Row: {
          tenant_id: string;
          flag_key: string;
          value: string | number | boolean | Record<string, unknown>;
          is_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          flag_key: string;
          value: string | number | boolean | Record<string, unknown>;
          is_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          flag_key?: string;
          value?: string | number | boolean | Record<string, unknown>;
          is_enabled?: boolean;
          updated_at?: string;
        };
      };
      meaningful_changes: {
        Row: {
          id: string;
          tenant_id: string;
          recon_job_id: string;
          drift_type: string;
          severity: string;
          field_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          recon_job_id: string;
          drift_type: string;
          severity: string;
          field_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          recon_job_id?: string;
          drift_type?: string;
          severity?: string;
          field_path?: string;
          created_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          tenant_id: string;
          source_id: string | null;
          canonical_json: Record<string, unknown>;
          hash: string;
          prev_hash: string | null;
          evidence_refs: unknown[];
          summary: string;
          why_it_matters: string;
          next_steps: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          source_id?: string | null;
          canonical_json: Record<string, unknown>;
          hash: string;
          prev_hash?: string | null;
          evidence_refs?: unknown[];
          summary: string;
          why_it_matters: string;
          next_steps?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          source_id?: string | null;
          canonical_json?: Record<string, unknown>;
          hash?: string;
          prev_hash?: string | null;
          evidence_refs?: unknown[];
          summary?: string;
          why_it_matters?: string;
          next_steps?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      recon_results: {
        Row: {
          id: string;
          recon_job_id: string;
          tenant_id: string;
          status: string;
          total_amount_unmatched: number;
          currency: string;
          unmatched_source_count: number;
          started_at: string;
          completed_at: string | null;
          summary: Record<string, unknown> | null;
          data: unknown;
        };
        Insert: {
          id?: string;
          recon_job_id: string;
          tenant_id: string;
          status: string;
          total_amount_unmatched?: number;
          currency?: string;
          unmatched_source_count?: number;
          started_at: string;
          completed_at?: string | null;
          summary?: Record<string, unknown> | null;
          data?: unknown;
        };
        Update: {
          id?: string;
          recon_job_id?: string;
          tenant_id?: string;
          status?: string;
          total_amount_unmatched?: number;
          currency?: string;
          unmatched_source_count?: number;
          started_at?: string;
          completed_at?: string | null;
          summary?: Record<string, unknown> | null;
          data?: unknown;
        };
      };
      recon_jobs: {
        Row: {
          id: string;
          tenant_id: string;
          source_id: string;
          status: string;
          currency: string;
          confidence: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          source_id: string;
          status?: string;
          currency?: string;
          confidence?: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          source_id?: string;
          status?: string;
          currency?: string;
          confidence?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
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
      get_user_activity_metrics: {
        Args: {
          user_id: string;
        };
        Returns: {
          total_jobs_created?: number;
          total_reconciliations?: number;
          last_activity_at?: string;
          usage_percentage?: number;
          [key: string]: unknown;
        };
      };
      set_tenant_context: {
        Args: {
          tenant_id: string;
        };
        Returns: null;
      };
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}
