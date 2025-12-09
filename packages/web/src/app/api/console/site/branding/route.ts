/**
 * Tenant Branding API
 * 
 * GET: Get branding for current tenant
 * PUT: Update branding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { requireAuth, checkPermission, SiteBuilderPermission } from '@/lib/tenant/permissions';
import { getTenantContext } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

/**
 * GET /api/console/site/branding
 * Get branding for current tenant
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
    
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId: tenantContext.tenantId },
    });
    
    if (!branding) {
      // Return defaults
      return NextResponse.json({
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          accentColor: '#06b6d4',
          backgroundColor: '#ffffff',
          borderRadiusScale: 1.0,
        },
      });
    }
    
    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/console/site/branding
 * Update branding
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
      SiteBuilderPermission.UPDATE_TENANT_BRANDING,
      tenantContext.tenantId
    );
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      borderRadiusScale,
      fontFamilyPrimary,
      fontFamilySecondary,
    } = body as {
      logoUrl?: string;
      faviconUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      borderRadiusScale?: number;
      fontFamilyPrimary?: string;
      fontFamilySecondary?: string;
    };
    
    // Validate colors (basic hex validation)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primaryColor && !colorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: 'Invalid primaryColor format' },
        { status: 400 }
      );
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: 'Invalid secondaryColor format' },
        { status: 400 }
      );
    }
    if (accentColor && !colorRegex.test(accentColor)) {
      return NextResponse.json(
        { error: 'Invalid accentColor format' },
        { status: 400 }
      );
    }
    if (backgroundColor && !colorRegex.test(backgroundColor)) {
      return NextResponse.json(
        { error: 'Invalid backgroundColor format' },
        { status: 400 }
      );
    }
    
    // Upsert branding
    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId: tenantContext.tenantId },
      update: {
        ...(logoUrl !== undefined && { logoUrl }),
        ...(faviconUrl !== undefined && { faviconUrl }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(accentColor !== undefined && { accentColor }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(borderRadiusScale !== undefined && { borderRadiusScale }),
        ...(fontFamilyPrimary !== undefined && { fontFamilyPrimary }),
        ...(fontFamilySecondary !== undefined && { fontFamilySecondary }),
      },
      create: {
        tenantId: tenantContext.tenantId,
        primaryColor: primaryColor || '#2563eb',
        secondaryColor: secondaryColor || '#7c3aed',
        accentColor: accentColor || '#06b6d4',
        backgroundColor: backgroundColor || '#ffffff',
        borderRadiusScale: borderRadiusScale ?? 1.0,
        logoUrl,
        faviconUrl,
        fontFamilyPrimary,
        fontFamilySecondary,
      },
    });
    
    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Error updating branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
