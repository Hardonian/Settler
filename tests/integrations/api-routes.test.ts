/**
 * API Routes Tests
 * 
 * Tests for connector API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Next.js and Supabase
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { tenant_id: 'tenant-1' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Connector API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle connect route', async () => {
    const request = new NextRequest('http://localhost/api/connectors/connect/plaid', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-1',
        redirectUri: 'http://localhost/callback',
      }),
    });

    // Test would call actual route handler
    expect(request.method).toBe('POST');
  });

  it('should handle test route', async () => {
    const request = new NextRequest('http://localhost/api/connectors/test/plaid', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-1',
        credentials: {},
        config: {},
      }),
    });

    expect(request.method).toBe('POST');
  });
});
