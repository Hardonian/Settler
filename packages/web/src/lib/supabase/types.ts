/**
 * Type-safe extensions for Supabase queries
 * 
 * Provides proper types for queries that Supabase's generated types
 * don't fully support (cross-schema queries, etc.)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Re-export table types for convenience
export type ConnectorRow = Database['public']['Tables']['connectors']['Row'];
export type ConnectorInsert = Database['public']['Tables']['connectors']['Insert'];
export type ConnectorUpdate = Database['public']['Tables']['connectors']['Update'];

export type ConnectorCredentialsRow = Database['public']['Tables']['connector_credentials']['Row'];
export type ConnectorCredentialsInsert = Database['public']['Tables']['connector_credentials']['Insert'];
export type ConnectorCredentialsUpdate = Database['public']['Tables']['connector_credentials']['Update'];

export type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert'];
export type WebhookEventUpdate = Database['public']['Tables']['webhook_events']['Update'];

export type MembershipRow = {
  tenant_id: string;
  user_id?: string;
  status: string;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Type-safe query builder for connectors table
 */
export interface ConnectorsQueryBuilder {
  select(columns: string): {
    eq(column: string, value: unknown): {
      eq(column: string, value: unknown): {
        limit(count: number): Promise<{ data: ConnectorRow[] | null; error: unknown }>;
        single(): Promise<{ data: ConnectorRow | null; error: unknown }>;
      };
      limit(count: number): Promise<{ data: ConnectorRow[] | null; error: unknown }>;
      single(): Promise<{ data: ConnectorRow | null; error: unknown }>;
    };
    limit(count: number): Promise<{ data: ConnectorRow[] | null; error: unknown }>;
  };
  insert(values: ConnectorInsert): {
    select(columns: string): {
      single(): Promise<{ data: ConnectorRow | null; error: unknown }>;
    };
  };
  update(values: ConnectorUpdate): {
    eq(column: string, value: unknown): Promise<{ error: unknown }>;
  };
}

/**
 * Type-safe query builder for connector_credentials table
 */
export interface ConnectorCredentialsQueryBuilder {
  select(columns: string): {
    eq(column: string, value: unknown): {
      single(): Promise<{ data: ConnectorCredentialsRow | null; error: unknown }>;
    };
  };
  upsert(
    values: ConnectorCredentialsInsert,
    options?: { onConflict?: string }
  ): Promise<{ error: unknown }>;
  delete(): {
    eq(column: string, value: unknown): Promise<{ error: unknown }>;
  };
}

/**
 * Type-safe query builder for app_private.memberships table
 */
export interface MembershipsQueryBuilder {
  select(columns: string): {
    eq(column: string, value: unknown): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          single(): Promise<{ data: MembershipRow | null; error: unknown }>;
          limit(count: number): Promise<{ data: MembershipRow[] | null; error: unknown }>;
        };
        single(): Promise<{ data: MembershipRow | null; error: unknown }>;
        limit(count: number): Promise<{ data: MembershipRow[] | null; error: unknown }>;
      };
      single(): Promise<{ data: MembershipRow | null; error: unknown }>;
      limit(count: number): Promise<{ data: MembershipRow[] | null; error: unknown }>;
    };
  };
}

/**
 * Type-safe query builder for webhook_events table
 */
export interface WebhookEventsQueryBuilder {
  insert(values: WebhookEventInsert): Promise<{ error: unknown }>;
}

/**
 * Extended Supabase client with type-safe query builders
 * This is a wrapper type that provides type-safe access to custom tables
 * Note: This doesn't extend SupabaseClient to avoid method override conflicts
 */
export interface ExtendedSupabaseClient {
  from(table: 'connectors'): ConnectorsQueryBuilder;
  from(table: 'connector_credentials'): ConnectorCredentialsQueryBuilder;
  from(table: 'webhook_events'): WebhookEventsQueryBuilder;
  from(table: 'app_private.memberships'): MembershipsQueryBuilder;
  // Include all other SupabaseClient methods
  auth: SupabaseClient<Database>['auth'];
  storage: SupabaseClient<Database>['storage'];
  functions: SupabaseClient<Database>['functions'];
  rest: SupabaseClient<Database>['rest'];
  realtime: SupabaseClient<Database>['realtime'];
  schema: SupabaseClient<Database>['schema'];
}

/**
 * Type-safe assertion helper
 * Use this instead of 'as any' to maintain type safety
 */
export function asExtendedClient(
  client: SupabaseClient<Database>
): ExtendedSupabaseClient {
  return client as unknown as ExtendedSupabaseClient;
}
