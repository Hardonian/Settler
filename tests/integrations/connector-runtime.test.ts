/**
 * Connector Runtime Tests
 * 
 * Tests for connector runtime functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectorRuntime, RuntimeConfig } from '@settler/adapters/src/connector-runtime';
import { ConnectorDriver, ConnectorMetadata } from '@settler/adapters/src/connector-driver';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'connector-1' },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'sync-run-1' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      upsert: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
}));

describe('ConnectorRuntime', () => {
  let runtime: ConnectorRuntime;
  let config: RuntimeConfig;

  beforeEach(() => {
    config = {
      supabaseUrl: 'https://test.supabase.co',
      supabaseServiceKey: 'test-key',
    };
    runtime = new ConnectorRuntime(config);
  });

  it('should initialize runtime', () => {
    expect(runtime).toBeInstanceOf(ConnectorRuntime);
  });

  it('should create sync run', async () => {
    const syncRunId = await runtime.createSyncRun('tenant-1', 'plaid', {
      since: new Date('2024-01-01'),
    });

    expect(syncRunId).toBeDefined();
  });

  it('should update sync run', async () => {
    await expect(
      runtime.updateSyncRun('sync-run-1', {
        status: 'completed',
        finishedAt: new Date(),
        transactionsSynced: 100,
      })
    ).resolves.not.toThrow();
  });
});

describe('ConnectorDriver Interface', () => {
  it('should have required metadata', () => {
    const metadata: ConnectorMetadata = {
      id: 'test',
      displayName: 'Test',
      category: 'bank_feed',
      authType: 'oauth2',
      description: 'Test connector',
      supportsWebhooks: false,
      supportsPolling: true,
      requiredConfig: [],
      optionalConfig: [],
    };

    expect(metadata.id).toBe('test');
    expect(metadata.authType).toBe('oauth2');
  });
});
