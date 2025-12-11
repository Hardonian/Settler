'use server';

import { prisma } from '@/shared/db/prismaClient';
import { getTenantContext } from '@/lib/tenant/server';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedTenantId() {
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

export async function getExperiment(id: string) {
    try {
        const tenantId = await getAuthenticatedTenantId();
        const experiment = await prisma.experiment.findUnique({
            where: { id },
            include: { 
                targetPage: true,
                variants: true
            }
        });

        if (!experiment || experiment.tenantId !== tenantId) {
            return { success: false, error: 'Experiment not found' };
        }

        return { success: true, data: experiment };
    } catch (error) {
        return { success: false, error: 'Failed to fetch experiment' };
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
                trafficSplit: {
                    'control': 50,
                    'variant-b': 50
                },
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
        console.error(error);
        return { success: false, error: 'Failed to create experiment' };
    }
}

export async function updateExperiment(id: string, data: any) {
    try {
        const tenantId = await getAuthenticatedTenantId();
        
        // Verify ownership
        const existing = await prisma.experiment.findUnique({ where: { id } });
        if (!existing || existing.tenantId !== tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.experiment.update({
            where: { id },
            data: {
                name: data.name,
                status: data.status,
                trafficSplit: data.trafficSplit,
                updatedAt: new Date(),
            }
        });
        
        revalidatePath(`/admin/experiments/${id}`);
        revalidatePath('/admin/experiments');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update experiment' };
    }
}
