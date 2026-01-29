"use server";

import { prisma } from "@/shared/db/prismaClient";
import { getTenantContext } from "@/lib/tenant/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

async function getAuthenticatedTenantId() {
  const context = await getTenantContext();
  if (context.tenantId) return context.tenantId;

  const defaultTenant = await prisma.tenant.findUnique({ where: { slug: "default" } });
  if (defaultTenant) return defaultTenant.id;

  throw new Error("No tenant context found");
}

type ActionState<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ExperimentWithTargetPage = {
  id: string;
  name: string;
  slug: string;
  status: string;
  targetPage: { slug: string | null } | null;
};

type ExperimentVariant = {
  id: string;
  key: string;
  label: string;
};

type ExperimentWithDetails = ExperimentWithTargetPage & {
  trafficSplit: Record<string, number>;
  variants: ExperimentVariant[];
};

type ExperimentUpdateInput = {
  name?: string;
  status?: string;
  trafficSplit?: Record<string, number>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTrafficSplit = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "number");

function parseExperimentUpdateInput(value: unknown): ExperimentUpdateInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const update: ExperimentUpdateInput = {};

  if (typeof value.name === "string") {
    update.name = value.name;
  }

  if (typeof value.status === "string") {
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

export async function getExperiments(): Promise<ActionState<ExperimentWithTargetPage[]>> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const experiments = await prisma.experiment.findMany({
      where: { tenantId },
      include: { targetPage: { select: { slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    const formattedExperiments: ExperimentWithTargetPage[] = experiments.map(
      (experiment: {
        id: string;
        name: string;
        slug: string;
        status: string;
        targetPage: { slug: string | null } | null;
      }) => ({
        id: experiment.id,
        name: experiment.name,
        slug: experiment.slug,
        status: experiment.status,
        targetPage: experiment.targetPage ? { slug: experiment.targetPage.slug } : null,
      })
    );
    return { success: true, data: formattedExperiments };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: "Failed to fetch experiments" };
  }
}

export async function getExperiment(id: string): Promise<ActionState<ExperimentWithDetails>> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        targetPage: { select: { slug: true } },
        variants: { select: { id: true, key: true, label: true } },
      },
    });

    if (!experiment || experiment.tenantId !== tenantId) {
      return { success: false, error: "Experiment not found" };
    }

    const response: ExperimentWithDetails = {
      id: experiment.id,
      name: experiment.name,
      slug: experiment.slug,
      status: experiment.status,
      targetPage: experiment.targetPage ? { slug: experiment.targetPage.slug } : null,
      trafficSplit: (experiment.trafficSplit ?? {}) as Record<string, number>,
      variants: experiment.variants,
    };

    return { success: true, data: response };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to fetch experiment" };
  }
}

export async function createExperiment(formData: FormData): Promise<ActionState<{ id: string }>> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const name = formData.get("name");
    const slug = formData.get("slug");
    const targetPageId = formData.get("targetPageId");

    if (typeof name !== "string" || typeof slug !== "string" || typeof targetPageId !== "string") {
      return { success: false, error: "Missing required fields" };
    }

    const experiment = await prisma.experiment.create({
      data: {
        tenantId,
        name,
        slug,
        targetPageId,
        status: "draft",
        trafficSplit: {
          control: 50,
          "variant-b": 50,
        },
        variants: {
          create: [
            { key: "control", label: "Control" },
            { key: "variant-b", label: "Variant B" },
          ],
        },
      },
    });

    revalidatePath("/admin/experiments");
    return { success: true, data: { id: experiment.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to create experiment" };
  }
}

export async function updateExperiment(id: string, data: unknown): Promise<ActionState> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const update = parseExperimentUpdateInput(data);

    if (!update || Object.keys(update).length === 0) {
      return { success: false, error: "Invalid update payload" };
    }

    const existing = await prisma.experiment.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Unauthorized" };
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
      data: updateData,
    });

    revalidatePath(`/admin/experiments/${id}`);
    revalidatePath("/admin/experiments");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update experiment" };
  }
}
