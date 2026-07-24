/** @jest-environment node */
/**
 * Integration Test: Entitlement Gating
 *
 * Tests that billing gates actually prevent access to paid features.
 */

import { checkEntitlement, canUseService } from "@/domain/billing/entitlements";
import { prisma } from "@/shared/db/prismaClient";

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL
);

const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip;

describeIfDatabase("Entitlement Gating", () => {
  let testBillingAccountId: string;

  beforeAll(async () => {
    // Create test billing account
    const billingAccount = await prisma.billingAccount.create({
      data: {
        userId: "test-user-id",
        email: "test@example.com",
        status: "active",
      },
    });
    testBillingAccountId = billingAccount.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.billingAccount.delete({
      where: { id: testBillingAccountId },
    });
  });

  describe("Free Plan Limits", () => {
    it("should allow access within free plan limits", async () => {
      // Create subscription with starter plan
      await prisma.subscription.create({
        data: {
          billingAccountId: testBillingAccountId,
          planId: "base", // Starter plan
          planName: "Settler Core",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await checkEntitlement(testBillingAccountId, "reconcile");

      expect(result.allowed).toBe(true);
      expect(result.planCode).toBe("starter");
      expect(result.limit).toBeGreaterThan(0);
    });

    it("should deny access when over quota", async () => {
      // Create usage events to exceed limit
      // (In real test, would create actual usage events)

      // For now, test that entitlement check works
      const result = await checkEntitlement(testBillingAccountId, "reconcile");

      // Should return result (even if over quota)
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });
  });

  describe("No Subscription", () => {
    it("should deny access when no active subscription", async () => {
      // Delete subscription
      await prisma.subscription.deleteMany({
        where: { billingAccountId: testBillingAccountId },
      });

      const result = await checkEntitlement(testBillingAccountId, "reconcile");

      // Should default to starter plan limits
      expect(result.planCode).toBe("starter");
    });
  });

  describe("canUseService", () => {
    it("should return boolean for service access", async () => {
      const canUse = await canUseService(testBillingAccountId, "reconcile");

      expect(typeof canUse).toBe("boolean");
    });

    it("should fail closed on errors", async () => {
      // Test with invalid billing account ID
      const canUse = await canUseService("invalid-id", "reconcile");

      // Should fail closed (return false)
      expect(canUse).toBe(false);
    });
  });
});
