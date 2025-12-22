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
      single(): Promise<{ data: ConnectorRow | null; error: unknown }>;
    };
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
 * Extended Supabase client with type-safe query builders
 */
export interface ExtendedSupabaseClient extends SupabaseClient<Database> {
  from(table: 'connectors'): ConnectorsQueryBuilder;
  from(table: 'connector_credentials'): ConnectorCredentialsQueryBuilder;
  from(table: 'app_private.memberships'): MembershipsQueryBuilder;
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
