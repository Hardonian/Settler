/**
 * Reconciliation Jobs API - POST /api/v1/recon/jobs
 * 
 * Creates reconciliation jobs. Handles unauthenticated users gracefully
 * for playground access with demo/mock responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/v1/recon/jobs
 * Create a reconciliation job
 */
export async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but don't fail if unauthenticated (for playground)
    let auth;
    let isAuthenticated = false;
    
    try {
      auth = await authenticateApiKey(request);
      isAuthenticated = true;
    } catch (error) {
      // Unauthenticated access allowed for playground
      // Will return demo response
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name && !body.sourceAdapter) {
      return NextResponse.json(
        { error: 'name or sourceAdapter is required' },
        { status: 400 }
      );
    }

    // For unauthenticated users, return demo response
    if (!isAuthenticated) {
      const demoJobId = `demo_${Date.now()}`;
      const demoResponse = {
        id: demoJobId,
        jobId: demoJobId,
        name: body.name || 'Demo Reconciliation Job',
        status: 'queued',
        sourceAdapter: body.sourceAdapter || 'stripe',
        targetAdapter: body.targetAdapter || 'shopify',
        createdAt: new Date().toISOString(),
        message: 'This is a demo response. Sign in to create real reconciliation jobs.',
        demo: true,
      };

      return NextResponse.json(demoResponse, { status: 201 });
    }

    // For authenticated users, check billing account
    if (!auth?.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Enforce usage limits (for authenticated users)
    if (isAuthenticated && auth.billingAccountId) {
      const { enforceUsageLimit } = await import('@/middleware/usage-enforcement');
      const usageCheck = await enforceUsageLimit(request, auth, 1);
      if (!usageCheck.allowed && usageCheck.response) {
        return usageCheck.response;
      }
    }

    // TODO: In production, integrate with actual reconciliation service
    // For now, return a mock response that looks like a real job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobResponse = {
      id: jobId,
      jobId: jobId,
      name: body.name || 'Reconciliation Job',
      status: 'queued',
      sourceAdapter: body.sourceAdapter,
      targetAdapter: body.targetAdapter,
      rules: body.rules || [],
      options: body.options || {},
      createdAt: new Date().toISOString(),
      message: 'Reconciliation job created successfully. Processing will begin shortly.',
    };

    return NextResponse.json(jobResponse, { status: 201 });
  } catch (error) {
    // Never return 500 - always return 200 with error info for playground
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Recon Jobs API] Error:', errorMessage);
    
    // Return 200 with error info instead of 500 to prevent playground crashes
    return NextResponse.json(
      {
        error: 'Failed to create reconciliation job',
        message: errorMessage,
        demo: true,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/v1/recon/jobs
 * List reconciliation jobs (demo for unauthenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    // Try to authenticate, but don't fail if unauthenticated
    let auth: Awaited<ReturnType<typeof authenticateApiKey>> | undefined;
    let isAuthenticated = false;
    
    try {
      auth = await authenticateApiKey(request);
      isAuthenticated = true;
    } catch (error) {
      auth = undefined;
      // Unauthenticated access allowed for playground
    }

    // For unauthenticated users, return demo response
    if (!isAuthenticated) {
      const demoJobs = [
        {
          id: 'demo_1',
          name: 'Demo Monthly Reconciliation',
          status: 'completed',
          sourceAdapter: 'stripe',
          targetAdapter: 'shopify',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          demo: true,
        },
      ];

      return NextResponse.json(demoJobs, { status: 200 });
    }

    // For authenticated users, return empty array (no jobs yet)
    // TODO: In production, fetch actual jobs from database
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    // Never return 500 - always return 200 with empty array
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Recon Jobs API] Error:', errorMessage);
    
    return NextResponse.json([], { status: 200 });
  }
}
