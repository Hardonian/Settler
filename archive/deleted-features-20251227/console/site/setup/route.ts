/**
 * Setup API
 * 
 * POST: Initialize default tenant and migrate existing content
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant/permissions';
import { createDefaultTenant, migrateHomepageToTenantPage } from '@/lib/tenant/setup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma

/**
 * POST /api/console/site/setup
 * Initialize default tenant
 */
export async function POST() {
  try {
    await requireAuth();
    
    // Only super admins can run setup
    // For now, allow any authenticated user (can be restricted later)
    
    const tenant = await createDefaultTenant();
    const homepage = await migrateHomepageToTenantPage(tenant.id);
    
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
      },
      homepage: {
        id: homepage.id,
        slug: homepage.slug,
      },
    });
  } catch (error) {
    console.error('Error setting up tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
