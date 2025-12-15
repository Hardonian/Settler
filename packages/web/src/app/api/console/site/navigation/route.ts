/**
 * Tenant Navigation API
 * 
 * GET: Get navigation for current tenant
 * PUT: Update navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';
import { TenantNavigationItem } from '@/shared/tenant/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

/**
 * GET /api/console/site/navigation
 * Get navigation for current tenant
 */
export async function GET() {
  try {
    await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    const navigation = await prisma.tenantNavigation.findUnique({
      where: { tenantId: tenantContext.tenantId },
    });
    
    if (!navigation) {
      // Return defaults
      return NextResponse.json({
        navigation: {
          navItems: [],
          footerItems: [],
        },
      });
    }
    
    return NextResponse.json({
      navigation: {
        navItems: (navigation.navItems as unknown) as TenantNavigationItem[],
        footerItems: (navigation.footerItems as unknown) as TenantNavigationItem[],
      },
    });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    // Return 200 with defaults instead of 500
    return NextResponse.json({
      navigation: {
        navItems: [],
        footerItems: [],
      },
    });
  }
}

/**
 * PUT /api/console/site/navigation
 * Update navigation
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const tenantContext = await getTenantContext();
    
    if (!tenantContext.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }
    
    // Check permission
    const canUpdate = await checkPermission(
      SiteBuilderPermission.UPDATE_TENANT_NAVIGATION,
      tenantContext.tenantId
    );
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { navItems, footerItems } = body as {
      navItems?: TenantNavigationItem[];
      footerItems?: TenantNavigationItem[];
    };
    
    // Validate navigation items
    if (navItems !== undefined) {
      if (!Array.isArray(navItems)) {
        return NextResponse.json(
          { error: 'navItems must be an array' },
          { status: 400 }
        );
      }
      
      for (const item of navItems) {
        if (!item.label || !item.href || !item.type) {
          return NextResponse.json(
            { error: 'Invalid navigation item structure' },
            { status: 400 }
          );
        }
        if (item.type !== 'internal' && item.type !== 'external') {
          return NextResponse.json(
            { error: 'Navigation item type must be "internal" or "external"' },
            { status: 400 }
          );
        }
      }
    }
    
    if (footerItems !== undefined) {
      if (!Array.isArray(footerItems)) {
        return NextResponse.json(
          { error: 'footerItems must be an array' },
          { status: 400 }
        );
      }
      
      for (const item of footerItems) {
        if (!item.label || !item.href || !item.type) {
          return NextResponse.json(
            { error: 'Invalid footer item structure' },
            { status: 400 }
          );
        }
      }
    }
    
    // Upsert navigation
    const navigation = await prisma.tenantNavigation.upsert({
      where: { tenantId: tenantContext.tenantId },
      update: {
        ...(navItems !== undefined && { navItems: navItems as unknown as any[] }),
        ...(footerItems !== undefined && { footerItems: footerItems as unknown as any[] }),
      },
      create: {
        tenantId: tenantContext.tenantId,
        navItems: (navItems || []) as unknown as any[],
        footerItems: (footerItems || []) as unknown as any[],
      },
    });
    
    return NextResponse.json({
      navigation: {
        navItems: (navigation.navItems as unknown) as TenantNavigationItem[],
        footerItems: (navigation.footerItems as unknown) as TenantNavigationItem[],
      },
    });
  } catch (error) {
    console.error('Error updating navigation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update navigation';
    // Return 200 with error message instead of 500
    return NextResponse.json(
      { error: errorMessage, navigation: null },
      { status: 200 }
    );
  }
}
