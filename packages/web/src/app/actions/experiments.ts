'use server';

import { prisma } from '@/shared/db/prismaClient';
import { getTenantContext } from '@/lib/tenant/server';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedTenantId() {
    // Reuse logic or import from admin.ts if shared
    const context = await getTenantContext();
    if (context.tenantId) return context.tenantId;
    
    const defaultTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (defaultTenant) return defaultTenant.id;
    
    throw new Error('No tenant context found');
}

export async function getExperiments() {
    try {
        const tenantId = await getAuthenticatedTenantId();
        const experiments = await prisma.experiment.findMany({
            where: { tenantId },
            include: { targetPage: true },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: experiments };
    } catch (error) {
        return { success: false, error: 'Failed to fetch experiments' };
    }
}

export async function createExperiment(formData: FormData) {
    try {
        const tenantId = await getAuthenticatedTenantId();
        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const targetPageId = formData.get('targetPageId') as string;

        if (!name || !slug || !targetPageId) {
            return { success: false, error: 'Missing required fields' };
        }

        const experiment = await prisma.experiment.create({
            data: {
                tenantId,
                name,
                slug,
                targetPageId,
                status: 'draft',
                variants: {
                    create: [
                        { key: 'control', label: 'Control' },
                        { key: 'variant-b', label: 'Variant B' }
                    ]
                }
            }
        });

        revalidatePath('/admin/experiments');
        return { success: true, data: experiment };
    } catch (error) {
        return { success: false, error: 'Failed to create experiment' };
    }
}
