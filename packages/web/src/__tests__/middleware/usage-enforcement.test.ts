import { enforceUsageLimit } from '@/middleware/usage-enforcement';
import type { ApiKeyAuthContext } from '@/shared/auth/apiKey';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/usage/tracking', () => ({
  checkAndIncrementUsage: jest.fn(),
  recordUsageEvent: jest.fn(),
}));

const { checkAndIncrementUsage } = jest.requireMock('@/lib/usage/tracking') as {
  checkAndIncrementUsage: jest.Mock;
};

describe('Usage enforcement', () => {
  const authContext: ApiKeyAuthContext = {
    apiKeyId: 'rk_test',
    userId: 'user-test',
    billingAccountId: '00000000-0000-0000-0000-000000000000',
    tenantId: undefined,
    scopes: [],
  };

  beforeEach(() => {
    checkAndIncrementUsage.mockReset();
  });

  it('fails closed when usage enforcement errors', async () => {
    checkAndIncrementUsage.mockRejectedValue(new Error('redis down'));

    const request = {
      nextUrl: { pathname: '/api/v1/recon/jobs' },
    } as unknown as NextRequest;

    const result = await enforceUsageLimit(request, authContext, 1);

    expect(result.allowed).toBe(false);
    expect(result.response?.status).toBe(503);
  });
});
