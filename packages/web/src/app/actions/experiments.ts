'use server';

import { prisma } from '@/shared/db/prismaClient';
import { getTenantContext } from '@/lib/tenant/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

async function getAuthenticatedTenantId() {
    const context = await getTenantContext();
    if (context.tenantId) return context.tenantId;
    
    const defaultTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (defaultTenant) return defaultTenant.id;
    
    throw new Error('No tenant context found');
}

type ActionState<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

type ExperimentUpdateInput = {
    name?: string;
    status?: string;
    trafficSplit?: Record<string, number>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isTrafficSplit = (value: unknown): value is Record<string, number> =>
    isRecord(value) && Object.values(value).every((entry) => typeof entry === 'number');

function parseExperimentUpdateInput(value: unknown): ExperimentUpdateInput | null {
    if (!isRecord(value)) {
        return null;
    }

    const update: ExperimentUpdateInput = {};

    if (typeof value.name === 'string') {
        update.name = value.name;
    }

    if (typeof value.status === 'string') {
        update.status = value.status;
    }

    if (value.trafficSplit !== undefined) {
        if (!isTrafficSplit(value.trafficSplit)) {
            return null;
        }
        update.trafficSplit = value.trafficSplit;
    }

    return update;
}

export async function getExperiments(): Promise<ActionState<Prisma.ExperimentGetPayload<{ include: { targetPage: true } }>[]>> {
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

export async function getExperiment(
    id: string
): Promise<ActionState<Prisma.ExperimentGetPayload<{ include: { targetPage: true; variants: true } }>>> {
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

export async function createExperiment(formData: FormData): Promise<ActionState> {
    try {
        const tenantId = await getAuthenticatedTenantId();
        const name = formData.get('name');
        const slug = formData.get('slug');
        const targetPageId = formData.get('targetPageId');

        if (typeof name !== 'string' || typeof slug !== 'string' || typeof targetPageId !== 'string') {
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

export async function updateExperiment(id: string, data: unknown): Promise<ActionState> {
    try {
        const tenantId = await getAuthenticatedTenantId();
        const update = parseExperimentUpdateInput(data);

        if (!update || Object.keys(update).length === 0) {
            return { success: false, error: 'Invalid update payload' };
        }
        
        // Verify ownership
        const existing = await prisma.experiment.findUnique({ where: { id } });
        if (!existing || existing.tenantId !== tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const updateData: Prisma.ExperimentUpdateInput = {
            updatedAt: new Date(),
        };

        if (update.name) {
            updateData.name = update.name;
        }

        if (update.status) {
            updateData.status = update.status;
        }

        if (update.trafficSplit) {
            updateData.trafficSplit = update.trafficSplit as Prisma.JsonObject;
        }

        await prisma.experiment.update({
            where: { id },
            data: updateData
        });
        
        revalidatePath(`/admin/experiments/${id}`);
        revalidatePath('/admin/experiments');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update experiment' };
    }
}
