/**
 * Billing Routes
 *
 * Provides endpoints for:
 * - Creating Stripe customers
 * - Managing subscriptions
 * - Purchasing add-ons
 * - Reporting usage
 * - Estimating invoices
 * - Handling Stripe webhooks
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { logError, logInfo } from "../utils/logger";
import Stripe from "stripe";
import { supabase } from "../infrastructure/supabase/client";

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Stripe product and price IDs (should be configured via environment or database)
// Note: These are used in route handlers, not at module level

/**
 * Create or retrieve billing account and Stripe customer
 * POST /api/billing/create-customer
 */
router.post("/create-customer", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;
    const email = req.body.email;
    const name = req.body.name;

    if (!userId || !email) {
      return res.status(400).json({
        error: "Bad Request",
        message: "User ID and email are required",
      });
    }

    // Check if billing account already exists
    let { data: billingAccount, error: fetchError } = await supabase
      .from("billing_accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      logError("Error fetching billing account", fetchError);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch billing account",
      });
    }

    // Create Stripe customer if billing account doesn't exist or doesn't have Stripe customer ID
    let stripeCustomerId = billingAccount?.stripe_customer_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: userId,
          tenant_id: tenantId || "",
        },
      });

      stripeCustomerId = stripeCustomer.id;
    }

    // Create or update billing account
    if (!billingAccount) {
      const { data: newBillingAccount, error: createError } = await supabase
        .from("billing_accounts")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          stripe_customer_id: stripeCustomerId,
          email,
          name,
          currency: "usd",
          status: "active",
        })
        .select()
        .single();

      if (createError) {
        logError("Error creating billing account", createError);
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to create billing account",
        });
      }

      billingAccount = newBillingAccount;
    } else if (!billingAccount.stripe_customer_id) {
      // Update existing billing account with Stripe customer ID
      const { data: updatedAccount, error: updateError } = await supabase
        .from("billing_accounts")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", billingAccount.id)
        .select()
        .single();

      if (updateError) {
        logError("Error updating billing account", updateError);
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to update billing account",
        });
      }

      billingAccount = updatedAccount;
    }

    logInfo("Billing account created/retrieved", {
      billingAccountId: billingAccount.id,
      stripeCustomerId,
    });

    return res.json({
      billing_account_id: billingAccount.id,
      stripe_customer_id: stripeCustomerId,
      email: billingAccount.email,
      status: billingAccount.status,
    });
  } catch (error) {
    logError("Failed to create customer", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create customer",
    });
  }
});

/**
 * Subscribe to base plan
 * POST /api/billing/subscribe
 */
router.post("/subscribe", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const billingAccountId = req.body.billing_account_id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!billingAccountId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "billing_account_id is required",
      });
    }

    // Use the global supabase client

    // Verify billing account belongs to user
    const { data: billingAccount, error: accountError } = await supabase
      .from("billing_accounts")
      .select("*")
      .eq("id", billingAccountId)
      .eq("user_id", userId)
      .single();

    if (accountError || !billingAccount) {
      return res.status(404).json({
        error: "Not Found",
        message: "Billing account not found",
      });
    }

    if (!billingAccount.stripe_customer_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Stripe customer ID not found. Please create customer first.",
      });
    }

    // Check for existing active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("billing_account_id", billingAccountId)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      return res.json({
        subscription_id: existingSubscription.id,
        stripe_subscription_id: existingSubscription.stripe_subscription_id,
        status: existingSubscription.status,
        message: "Active subscription already exists",
      });
    }

    // Get or create Stripe price for base plan
    // In production, you'd fetch this from Stripe or database
    const basePriceId: string = process.env.STRIPE_PRICE_BASE_PLAN || "price_base_plan";

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: billingAccount.stripe_customer_id,
      items: [{ price: basePriceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        billing_account_id: billingAccountId,
        user_id: userId,
      },
    });

    // Create subscription record in database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        billing_account_id: billingAccountId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: basePriceId,
        plan_id: "base",
        plan_name: "Settler Core",
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        trial_start: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      })
      .select()
      .single();

    if (subError) {
      logError("Error creating subscription", subError);
      // Cancel Stripe subscription if database insert fails
      await stripe.subscriptions.cancel(stripeSubscription.id);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create subscription",
      });
    }

    logInfo("Subscription created", {
      subscriptionId: subscription.id,
      stripeSubscriptionId: stripeSubscription.id,
    });

    return res.json({
      subscription_id: subscription.id,
      stripe_subscription_id: stripeSubscription.id,
      status: subscription.status,
      client_secret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    });
  } catch (error) {
    logError("Failed to create subscription", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create subscription",
    });
  }
});

/**
 * Purchase an add-on
 * POST /api/billing/addon/purchase
 */
router.post("/addon/purchase", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { billing_account_id, add_on_id } = req.body;

    if (!billing_account_id || !add_on_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "billing_account_id and add_on_id are required",
      });
    }

    // Use the global supabase client

    // Verify billing account
    const { data: billingAccount, error: accountError } = await supabase
      .from("billing_accounts")
      .select("*")
      .eq("id", billing_account_id)
      .eq("user_id", userId)
      .single();

    if (accountError || !billingAccount) {
      return res.status(404).json({
        error: "Not Found",
        message: "Billing account not found",
      });
    }

    // Get add-on details
    const { data: addOn, error: addOnError } = await supabase
      .from("add_ons")
      .select("*")
      .eq("id", add_on_id)
      .eq("is_active", true)
      .single();

    if (addOnError || !addOn) {
      return res.status(404).json({
        error: "Not Found",
        message: "Add-on not found or inactive",
      });
    }

    // Check if add-on is already purchased
    const { data: existingPurchase } = await supabase
      .from("add_on_purchases")
      .select("*")
      .eq("billing_account_id", billing_account_id)
      .eq("add_on_id", add_on_id)
      .eq("status", "active")
      .single();

    if (existingPurchase) {
      return res.json({
        purchase_id: existingPurchase.id,
        message: "Add-on already purchased",
      });
    }

    // Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("billing_account_id", billing_account_id)
      .eq("status", "active")
      .single();

    if (subError || !subscription || !subscription.stripe_subscription_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Active subscription required to purchase add-ons",
      });
    }

    // Add item to Stripe subscription
    const stripePriceId = addOn.stripe_price_id || `price_${addOn.integration_id}`;
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscription.stripe_subscription_id,
      price: stripePriceId,
      quantity: 1,
    });

    // Create add-on purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("add_on_purchases")
      .insert({
        billing_account_id: billing_account_id,
        add_on_id: add_on_id,
        stripe_subscription_item_id: subscriptionItem.id,
        status: "active",
      })
      .select()
      .single();

    if (purchaseError) {
      logError("Error creating add-on purchase", purchaseError);
      // Remove from Stripe subscription if database insert fails
      await stripe.subscriptionItems.del(subscriptionItem.id);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create add-on purchase",
      });
    }

    logInfo("Add-on purchased", {
      purchaseId: purchase.id,
      addOnId: add_on_id,
      integrationId: addOn.integration_id,
    });

    return res.json({
      purchase_id: purchase.id,
      add_on_id: add_on_id,
      integration_id: addOn.integration_id,
      name: addOn.name,
      status: purchase.status,
    });
  } catch (error) {
    logError("Failed to purchase add-on", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to purchase add-on",
    });
  }
});

/**
 * Report usage for billing
 * POST /api/billing/usage/report
 */
router.post("/usage/report", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { billing_account_id, event_type, quantity, integration_id, add_on_id, unit, metadata } =
      req.body;

    if (!billing_account_id || !event_type) {
      return res.status(400).json({
        error: "Bad Request",
        message: "billing_account_id and event_type are required",
      });
    }

    // Use the global supabase client

    // Verify billing account
    const { data: billingAccount, error: accountError } = await supabase
      .from("billing_accounts")
      .select("*")
      .eq("id", billing_account_id)
      .eq("user_id", userId)
      .single();

    if (accountError || !billingAccount) {
      return res.status(404).json({
        error: "Not Found",
        message: "Billing account not found",
      });
    }

    // Log usage event via database function
    const { data: eventId, error: rpcError } = await supabase.rpc("log_usage_event", {
      p_billing_account_id: billing_account_id,
      p_event_type: event_type,
      p_quantity: quantity || 1,
      p_project_id: req.body.project_id || null,
      p_user_id: userId,
      p_tenant_id: billingAccount.tenant_id,
      p_integration_id: integration_id || null,
      p_add_on_id: add_on_id || null,
      p_unit: unit || null,
      p_metadata: metadata || {},
    });

    if (rpcError) {
      logError("Error logging usage event", rpcError);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to log usage event",
      });
    }

    return res.json({
      success: true,
      event_id: eventId,
      message: "Usage event logged successfully",
    });
  } catch (error) {
    logError("Failed to report usage", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to report usage",
    });
  }
});

/**
 * Get estimated invoice
 * GET /api/billing/invoice/estimate
 */
router.get("/invoice/estimate", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const billingAccountId = req.query.billing_account_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!billingAccountId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "billing_account_id is required",
      });
    }

    // Use the global supabase client

    // Verify billing account
    const { data: billingAccount, error: accountError } = await supabase
      .from("billing_accounts")
      .select("*")
      .eq("id", billingAccountId)
      .eq("user_id", userId)
      .single();

    if (accountError || !billingAccount) {
      return res.status(404).json({
        error: "Not Found",
        message: "Billing account not found",
      });
    }

    // Compute estimated bill
    const { data: bill, error: computeError } = await supabase.rpc("compute_estimated_bill", {
      p_billing_account_id: billingAccountId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (computeError) {
      logError("Error computing bill", computeError);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to compute bill",
      });
    }

    return res.json(bill);
  } catch (error) {
    logError("Failed to estimate invoice", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to estimate invoice",
    });
  }
});

/**
 * Handle Stripe webhooks
 * POST /api/billing/webhook
 * Note: Raw body middleware is applied in index.ts before this router
 */
router.post("/webhook", async (req: AuthRequest, res: Response) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logError("Stripe webhook secret not configured", new Error("Missing STRIPE_WEBHOOK_SECRET"));
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Webhook secret not configured",
      });
    }

    let event: Stripe.Event;

    try {
      // Get raw body (set by middleware or use req.body if Buffer)
      const rawBody =
        (req as any).rawBody ||
        (req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body)));
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      logError("Webhook signature verification failed", err);
      return res.status(400).json({
        error: "Bad Request",
        message: `Webhook Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Use the global supabase client

    // Log webhook event
    await supabase.from("stripe_event_log").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as any,
      processed: false,
    });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceEvent(supabase, invoice);
        break;
      }

      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceUpcoming(supabase, invoice);
        break;
      }

      default:
        logInfo("Unhandled Stripe webhook event", { type: event.type });
    }

    // Mark event as processed
    await supabase
      .from("stripe_event_log")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    return res.json({ received: true });
  } catch (error) {
    logError("Failed to handle webhook", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to handle webhook",
    });
  }
});

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logError("Error updating subscription", error);
  }
}

// Helper function to handle invoice events
async function handleInvoiceEvent(_supabase: any, invoice: Stripe.Invoice) {
  // In a real implementation, you'd:
  // 1. Update invoice status in database
  // 2. Send email notifications
  // 3. Update billing account status if payment failed
  logInfo("Invoice event processed", {
    invoiceId: invoice.id,
    status: invoice.status,
    amount: invoice.amount_paid,
  });
}

// Helper function to handle upcoming invoices
async function handleInvoiceUpcoming(_supabase: any, invoice: Stripe.Invoice) {
  // In a real implementation, you'd:
  // 1. Send email notification about upcoming invoice
  // 2. Check for usage overages
  // 3. Trigger upgrade alerts if needed
  logInfo("Upcoming invoice", {
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    customerId: invoice.customer,
  });
}

export { router as billingRouter };
