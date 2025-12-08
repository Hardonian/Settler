import { http, HttpResponse } from 'msw';

const API_BASE = 'https://api.settler.dev';

export const handlers = [
  // Jobs API
  http.get(`${API_BASE}/api/v1/jobs`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'job_123',
          userId: 'user_123',
          name: 'Test Job',
          source: { adapter: 'shopify', config: {} },
          target: { adapter: 'stripe', config: {} },
          rules: { matching: [] },
          status: 'active',
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
        },
      ],
      count: 1,
    });
  }),

  http.get(`${API_BASE}/api/v1/jobs/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        userId: 'user_123',
        name: 'Test Job',
        source: { adapter: 'shopify', config: {} },
        target: { adapter: 'stripe', config: {} },
        rules: { matching: [] },
        status: 'active',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      },
    });
  }),

  http.post(`${API_BASE}/api/v1/jobs`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null | undefined;
    const bodyObj: Record<string, unknown> = body && typeof body === 'object' && !Array.isArray(body) && body !== null ? body : {};
    return HttpResponse.json(
      {
        data: Object.assign(
          {
            id: 'job_new',
            userId: 'user_123',
            status: 'active',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
          bodyObj
        ),
        message: 'Reconciliation job created successfully',
      },
      { status: 201 }
    );
  }),

  http.post(`${API_BASE}/api/v1/jobs/:id/run`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: 'exec_123',
        jobId: params.id,
        status: 'running',
        startedAt: '2026-01-15T10:00:00Z',
      },
      message: 'Job execution started',
    });
  }),

  http.delete(`${API_BASE}/api/v1/jobs/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Reports API
  http.get(`${API_BASE}/api/v1/reports/:jobId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        jobId: params.jobId,
        dateRange: {
          start: '2026-01-01T00:00:00Z',
          end: '2026-01-31T23:59:59Z',
        },
        summary: {
          matched: 145,
          unmatched: 3,
          errors: 1,
          accuracy: 98.7,
          totalTransactions: 149,
        },
        matches: [],
        unmatched: [],
        errors: [],
        generatedAt: '2026-01-15T10:00:00Z',
      },
    });
  }),

  http.get(`${API_BASE}/api/v1/reports`, () => {
    return HttpResponse.json({
      data: [
        {
          jobId: 'job_123',
          dateRange: {
            start: '2026-01-01T00:00:00Z',
            end: '2026-01-31T23:59:59Z',
          },
          summary: {
            matched: 145,
            unmatched: 3,
            errors: 1,
            accuracy: 98.7,
            totalTransactions: 149,
          },
          generatedAt: '2026-01-15T10:00:00Z',
        },
      ],
      count: 1,
    });
  }),

  // Webhooks API
  http.get(`${API_BASE}/api/v1/webhooks`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'wh_123',
          userId: 'user_123',
          url: 'https://example.com/webhook',
          events: ['reconciliation.matched'],
          secret: 'whsec_abc123',
          status: 'active',
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
      count: 1,
    });
  }),

  http.post(`${API_BASE}/api/v1/webhooks`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null | undefined;
    const bodyObj: Record<string, unknown> = body && typeof body === 'object' && !Array.isArray(body) && body !== null ? body : {};
    return HttpResponse.json(
      {
        data: Object.assign(
          {
            id: 'wh_new',
            userId: 'user_123',
            secret: 'whsec_abc123',
            status: 'active',
            createdAt: '2026-01-15T10:00:00Z',
          },
          bodyObj
        ),
        message: 'Webhook created successfully',
      },
      { status: 201 }
    );
  }),

  http.delete(`${API_BASE}/api/v1/webhooks/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Adapters API
  http.get(`${API_BASE}/api/v1/adapters`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Reconcile Stripe payments and charges',
          version: '1.0.0',
          config: {
            required: ['apiKey'],
            optional: ['webhookSecret'],
          },
          supportedEvents: ['payment.succeeded', 'charge.refunded'],
        },
        {
          id: 'shopify',
          name: 'Shopify',
          description: 'Reconcile Shopify orders and transactions',
          version: '1.0.0',
          config: {
            required: ['apiKey', 'shopDomain'],
            optional: ['webhookSecret'],
          },
          supportedEvents: ['order.created', 'order.updated'],
        },
      ],
      count: 2,
    });
  }),

  http.get(`${API_BASE}/api/v1/adapters/:id`, ({ params }) => {
    const adapters: Record<string, any> = {
      stripe: {
        id: 'stripe',
        name: 'Stripe',
        description: 'Reconcile Stripe payments and charges',
        version: '1.0.0',
        config: {
          required: ['apiKey'],
          optional: ['webhookSecret'],
        },
        supportedEvents: ['payment.succeeded', 'charge.refunded'],
      },
      shopify: {
        id: 'shopify',
        name: 'Shopify',
        description: 'Reconcile Shopify orders and transactions',
        version: '1.0.0',
        config: {
          required: ['apiKey', 'shopDomain'],
          optional: ['webhookSecret'],
        },
        supportedEvents: ['order.created', 'order.updated'],
      },
    };

    const adapter = adapters[params.id as string];
    if (!adapter) {
      return HttpResponse.json(
        { error: 'Not Found', message: 'Adapter not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: adapter });
  }),

  // Error responses
  http.get(`${API_BASE}/api/v1/error/400`, () => {
    return HttpResponse.json(
      {
        error: 'ValidationError',
        message: 'Invalid request parameters',
        details: [{ field: 'name', message: 'Name is required' }],
      },
      { status: 400 }
    );
  }),

  http.get(`${API_BASE}/api/v1/error/401`, () => {
    return HttpResponse.json(
      {
        error: 'AuthError',
        message: 'Invalid API key',
      },
      { status: 401 }
    );
  }),

  http.get(`${API_BASE}/api/v1/error/429`, () => {
    return HttpResponse.json(
      {
        error: 'RateLimitError',
        message: 'Rate limit exceeded',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
          'Retry-After': '60',
        },
      }
    );
  }),

  http.get(`${API_BASE}/api/v1/error/500`, () => {
    return HttpResponse.json(
      {
        error: 'ServerError',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }),
];
