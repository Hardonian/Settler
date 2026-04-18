import { PrismaClient } from "@prisma/client";
import { logError, logInfo } from "../../utils/logger";
import { sendNotification, NotificationEventType, notifyJobFailure } from "../notifications";
import { AlertManager, AlertSeverity } from "./alert-manager";

export class NotificationService {
  private alertManager: AlertManager;

  constructor(prisma: PrismaClient) {
    this.alertManager = new AlertManager(prisma);
  }

  /**
   * Send a generic notification
   */
  async notify(
    tenantId: string,
    eventType: string,
    message: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Use existing sendNotification logic
      await sendNotification(tenantId, eventType as NotificationEventType, [{ userId }], {
        subject: eventType.replace(/_/g, " ").toUpperCase(),
        body: message,
        metadata,
      });

      // Also send an alert for medium/high severity events
      if (metadata?.severity === "high" || metadata?.severity === "critical") {
        await this.alertManager.sendAlert({
          tenantId,
          type: eventType,
          message,
          severity: metadata.severity as AlertSeverity,
          metadata,
        });
      }

      logInfo("Notification dispatched via service", { tenantId, eventType, userId });
    } catch (error) {
      logError("NotificationService.notify failed", error, { tenantId, eventType });
    }
  }

  /**
   * Notify on failure
   */
  async notifyFailure(
    tenantId: string,
    context: string,
    error: string,
    userId?: string
  ): Promise<void> {
    await this.notify(tenantId, "job_failed", `${context} failed: ${error}`, userId, {
      severity: "high",
      error,
    });
  }

  /**
   * Legacy wrapper for notifyJobFailure
   */
  async notifyJobFailure(
    tenantId: string,
    jobId: string,
    errorMessage: string,
    userId?: string
  ): Promise<void> {
    return notifyJobFailure(tenantId, jobId, errorMessage, userId);
  }
}

// In a real app, this might be instantiated with a shared Prisma client
// For now, we'll export a getter or an instance if we can get the client
let instance: NotificationService | null = null;

export const getNotificationService = (prisma: PrismaClient): NotificationService => {
  if (!instance) {
    instance = new NotificationService(prisma);
  }
  return instance;
};

// For compatibility with existing imports that might expect a default export or a named constant
// We'll need to see how it's used. In workflow-engine.ts:
// import { notificationService } from "../notifications/notification-service";
// It's used as notificationService.notify(...)
// This implies it's a singleton instance.

// We need a way to get the prisma client here or assume it's provided later.
// However, the import is at the top level.
// Many services in this repo seem to import prisma directly.

import { prisma } from "../../infrastructure/db/prisma";
export const notificationService = new NotificationService(prisma);
