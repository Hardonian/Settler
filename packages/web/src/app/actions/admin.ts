'use server';

import { prisma } from '@/shared/db/prismaClient';
import { getTenantContext } from '@/lib/tenant/server';
import { revalidatePath } from 'next/cache';
import { PageBlock } from '@/domain/siteBuilder/pageSchema';

export type ActionState = {
  success?: boolean;
  error?: string;
  data?: any;
};

/**
 * Ensure we have a valid tenant context.
 * In a real app, this would also check for Admin permissions.
 */
async function getAuthenticatedTenantId() {
  const context = await getTenantContext();
  
  if (context.tenantId) {
    return context.tenantId;
  }

  // Fallback for development/initial setup if no tenant resolved from headers
  // We try to find the 'default' tenant
  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'default' }
  });

  if (defaultTenant) {
    return defaultTenant.id;
  }

  throw new Error('No tenant context found and no default tenant available.');
}

export async function getPages(): Promise<ActionState> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    
    const pages = await prisma.tenantPage.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        isDraft: true,
        updatedAt: true,
        metadata: true,
      }
    });

    // Map to a friendlier format
    const formattedPages = pages.map(p => {
        const meta = p.metadata as Record<string, any>;
        return {
            id: p.id,
            title: meta.title || p.slug || 'Untitled Page',
            slug: p.slug,
            status: p.isDraft ? 'draft' : 'published',
            lastUpdated: p.updatedAt.toISOString(),
        };
    });

    return { success: true, data: formattedPages };
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return { success: false, error: 'Failed to load pages' };
  }
}

export async function getPage(id: string): Promise<ActionState> {
    try {
        const tenantId = await getAuthenticatedTenantId();
        
        const page = await prisma.tenantPage.findUnique({
            where: { id },
        });

        if (!page || page.tenantId !== tenantId) {
            return { success: false, error: 'Page not found' };
        }

        return { success: true, data: page };
    } catch (error) {
        console.error('Failed to fetch page:', error);
        return { success: false, error: 'Failed to fetch page' };
    }
}

export async function createPage(formData: FormData): Promise<ActionState> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;

    if (!title || !slug) {
        return { success: false, error: 'Title and Slug are required' };
    }

    // Basic slug validation
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-/]/g, '-');

    const newPage = await prisma.tenantPage.create({
      data: {
        tenantId,
        slug: cleanSlug,
        pageType: 'custom',
        isDraft: true,
        metadata: { title }, // Store title in metadata as per schema
        blocks: [
            {
                id: 'hero-1',
                type: 'hero',
                visible: true,
                title: title,
                subtitle: 'New page subtitle',
                description: 'Add your content here.',
                alignment: 'center'
            }
        ]
      }
    });

    revalidatePath('/admin/pages');
    return { success: true, data: newPage };
  } catch (error) {
    console.error('Failed to create page:', error);
    return { success: false, error: 'Failed to create page' };
  }
}

export async function updatePageBlocks(id: string, blocks: PageBlock[], metadata?: any): Promise<ActionState> {
    try {
        const tenantId = await getAuthenticatedTenantId();
        
        // Verify ownership
        const existingPage = await prisma.tenantPage.findUnique({
            where: { id }
        });

        if (!existingPage || existingPage.tenantId !== tenantId) {
            return { success: false, error: 'Page not found or unauthorized' };
        }

        await prisma.tenantPage.update({
            where: { id },
            data: {
                blocks: blocks as any, // Prisma Json handling
                metadata: metadata ? { ...existingPage.metadata as object, ...metadata } : undefined,
                updatedAt: new Date(),
            }
        });

        revalidatePath(`/admin/pages/${id}/editor`);
        revalidatePath(`/${existingPage.slug}`); // Revalidate the public path too
        
        return { success: true };
    } catch (error) {
        console.error('Failed to update page:', error);
        return { success: false, error: 'Failed to update page' };
    }
}

export async function deletePage(id: string): Promise<ActionState> {
    try {
        const tenantId = await getAuthenticatedTenantId();
        
        const existingPage = await prisma.tenantPage.findUnique({
            where: { id }
        });

        if (!existingPage || existingPage.tenantId !== tenantId) {
            return { success: false, error: 'Page not found' };
        }

        await prisma.tenantPage.delete({
            where: { id }
        });

        revalidatePath('/admin/pages');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete page:', error);
        return { success: false, error: 'Failed to delete page' };
    }
}
