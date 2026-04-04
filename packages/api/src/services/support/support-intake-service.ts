import { logError } from "../../utils/logger";
import { eventBus } from "../events/event-bus";
import { prisma } from "../../infrastructure/db/prisma";
import { buildSupportIntakeRunContext } from "@settler/reconciliation-core";
import {
  submitSupportIntake as submitSupportIntakeCore,
  type StoredSupportIntake,
} from "@settler/support-intake";

export type { StoredSupportIntake };

export async function submitSupportIntake(params: {
  userId: string;
  tenantId: string;
  path: string;
  body: unknown;
}): Promise<StoredSupportIntake> {
  try {
    return await submitSupportIntakeCore({
      prisma,
      userId: params.userId,
      tenantId: params.tenantId,
      path: params.path,
      body: params.body,
      resolveRunContext: (tenantId, runId) => buildSupportIntakeRunContext(prisma, tenantId, runId),
      hooks: {
        afterPersist: async ({
          submissionId,
          tenantId,
          userId,
          path: _path,
          payload,
          runContext,
        }) => {
          await eventBus.emitEvent(
            "support.issue.created",
            tenantId,
            {
              submissionId,
              category: payload.category,
              runId: payload.run_id ?? null,
              runIntelligence: runContext,
              route: payload.route ?? null,
              module: payload.module ?? null,
            },
            {
              correlationId: `support:${tenantId}:${submissionId}`,
              runId: payload.run_id ?? undefined,
              executionId: payload.run_id ?? submissionId,
              actorId: userId,
              source: "api.support-intake",
              severity: "info",
            }
          );
        },
      },
    });
  } catch (error) {
    logError("Failed to persist support intake submission", error, {
      tenantId: params.tenantId,
      userId: params.userId,
    });
    throw error;
  }
}
