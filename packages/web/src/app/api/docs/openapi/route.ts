/**
 * OpenAPI Schema Endpoint
 * 
 * GET /api/docs/openapi - Returns OpenAPI 3.0 schema for console API
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/api/openapi-generator';
import { publicRoute } from '@/middleware/billing-gate-universal';
import {
  createApiKeySchema,
  listApiKeysSchema,
  listReceiptsSchema,
  getReceiptSchema,
  listFeatureFlagsSchema,
  getUsageSchema,
  createPageSchema,
  updatePageSchema,
  updateBrandingSchema,
  updateNavigationSchema,
} from '@/lib/api/console-schemas';

export const dynamic = 'force-dynamic';

export const GET = publicRoute(async function GET() {
  const routes = [
    {
      path: '/api/console/api-keys',
      method: 'get' as const,
      summary: 'List API keys',
      description: 'Get all API keys for the authenticated user',
      tags: ['API Keys'],
      requestSchema: listApiKeysSchema,
      authRequired: true,
    },
    {
      path: '/api/console/api-keys',
      method: 'post' as const,
      summary: 'Create API key',
      description: 'Create a new API key',
      tags: ['API Keys'],
      requestSchema: createApiKeySchema,
      authRequired: true,
    },
    {
      path: '/api/console/receipts',
      method: 'get' as const,
      summary: 'List receipts',
      description: 'Get receipts for the authenticated user',
      tags: ['Receipts'],
      requestSchema: listReceiptsSchema,
      authRequired: true,
    },
    {
      path: '/api/console/receipts/{id}',
      method: 'get' as const,
      summary: 'Get receipt',
      description: 'Get receipt details by ID',
      tags: ['Receipts'],
      requestSchema: getReceiptSchema,
      authRequired: true,
    },
    {
      path: '/api/console/feature-flags',
      method: 'get' as const,
      summary: 'List feature flags',
      description: 'Get feature flags for the billing account',
      tags: ['Feature Flags'],
      requestSchema: listFeatureFlagsSchema,
      authRequired: true,
    },
    {
      path: '/api/console/usage',
      method: 'get' as const,
      summary: 'Get usage statistics',
      description: 'Get usage statistics for the billing account',
      tags: ['Usage'],
      requestSchema: getUsageSchema,
      authRequired: true,
    },
    {
      path: '/api/console/site/pages',
      method: 'post' as const,
      summary: 'Create page',
      description: 'Create a new site builder page',
      tags: ['Site Builder'],
      requestSchema: createPageSchema,
      authRequired: true,
    },
    {
      path: '/api/console/site/pages/{id}',
      method: 'put' as const,
      summary: 'Update page',
      description: 'Update an existing page',
      tags: ['Site Builder'],
      requestSchema: updatePageSchema,
      authRequired: true,
    },
    {
      path: '/api/console/site/branding',
      method: 'put' as const,
      summary: 'Update branding',
      description: 'Update tenant branding',
      tags: ['Site Builder'],
      requestSchema: updateBrandingSchema,
      authRequired: true,
    },
    {
      path: '/api/console/site/navigation',
      method: 'put' as const,
      summary: 'Update navigation',
      description: 'Update tenant navigation',
      tags: ['Site Builder'],
      requestSchema: updateNavigationSchema,
      authRequired: true,
    },
  ];

  const spec = generateOpenAPISpec(routes);

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
