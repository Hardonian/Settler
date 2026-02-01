/**
 * Stripe Usage Sync Service
 * 
 * Syncs metered usage to Stripe for billing
 * Part of Phase II: Billing Expansion
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { logError, logInfo } from '../../utils/logger';

export class StripeUsageSync {
  private prisma: PrismaClient;
  private stripe: Stripe;

  constructor(prisma: PrismaClient, stripeKey: string) {
    this.prisma = prisma;
    // Use a supported API version - update when Stripe types are updated
    this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as Stripe.LatestApiVersion });
  }

  /**
   * Sync usage events to Stripe
   */
  async syncUsageToStripe(billingAccountId: string, startDate: Date, endDate: Date): Promise<void> {
    try {
      const billingAccount = await this.prisma.billingAccount.findUnique({
        where: { id: billingAccountId },
        include: {
          subscriptions: {
            where: { status: 'active' },
            include: {
              billingAccount: true,
            },
          },
        },
      });

      if (!billingAccount?.stripeCustomerId) {
        logError('No Stripe customer ID found', { billingAccountId });
        return;
      }

      // Get usage events for the period
      const usageEvents = await this.prisma.usageEvent.findMany({
        where: {
          billingAccountId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          aggregated: false,
        },
      });

      // Group by event type and subscription item
      const usageByType = new Map<string, { quantity: number; unit: string }>();

      for (const event of usageEvents) {
        const key = event.eventType;
        if (!usageByType.has(key)) {
          usageByType.set(key, { quantity: 0, unit: event.unit || 'unit' });
        }
        const current = usageByType.get(key)!;
        current.quantity += Number(event.quantity);
      }

      // Create usage records in Stripe
      for (const subscription of billingAccount.subscriptions) {
        if (!subscription.stripeSubscriptionId) continue;

        const subscriptionItems = await this.stripe.subscriptionItems.list({
          subscription: subscription.stripeSubscriptionId,
        });

        for (const [eventType, usage] of usageByType.entries()) {
          // Find matching subscription item by metadata or event type
          const matchingItem = subscriptionItems.data.find(
            item => item.metadata?.eventType === eventType
          );

          if (matchingItem && usage.quantity > 0) {
            await this.stripe.subscriptionItems.createUsageRecord(
              matchingItem.id,
              {
                quantity: Math.round(usage.quantity),
                timestamp: Math.floor(endDate.getTime() / 1000),
              }
            );

            logInfo('Usage synced to Stripe', {
              billingAccountId,
              eventType,
              quantity: usage.quantity,
              subscriptionItemId: matchingItem.id,
            });
          }
        }
      }

      // Mark events as aggregated
      await this.prisma.usageEvent.updateMany({
        where: {
          billingAccountId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          aggregated: false,
        },
        data: {
          aggregated: true,
        },
      });
    } catch (error) {
      logError('Failed to sync usage to Stripe', { error, billingAccountId });
      throw error;
    }
  }

  /**
   * Sync usage for current billing period
   */
  async syncCurrentPeriod(billingAccountId: string): Promise<void> {
    const billingAccount = await this.prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          take: 1,
        },
      },
    });

    if (!billingAccount?.subscriptions[0]) {
      return;
    }

    const subscription = billingAccount.subscriptions[0];
    const startDate = subscription.currentPeriodStart;
    const endDate = new Date();

    await this.syncUsageToStripe(billingAccountId, startDate, endDate);
  }
}
