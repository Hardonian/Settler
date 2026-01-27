import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    // Generate solution based on answers (in production, use AI/LLM)
    let solution = "";

    const issue = answers[0];
    if (issue === "integration_error") {
      const integration = answers[1];
      const errorType = answers[2];

      if (errorType === "api_key_invalid") {
        solution = `For ${integration}, invalid API keys are usually caused by:\n\n1. Expired or revoked API keys - Check your ${integration} dashboard\n2. Incorrect key format - Ensure you're using the correct key type (test vs live)\n3. Missing permissions - Your API key needs specific scopes\n\nTo fix:\n- Go to ${integration} settings and generate a new API key\n- Copy the key exactly as shown\n- Update it in Settler's integration settings\n- Test the connection again`;
      } else if (errorType === "rate_limit") {
        solution = `Rate limiting with ${integration} means you're making too many API calls.\n\nSolutions:\n1. Reduce sync frequency in integration settings\n2. Use webhooks instead of polling when possible\n3. Contact ${integration} support to increase your rate limits\n4. Consider upgrading your ${integration} plan if limits are too low`;
      } else if (errorType === "permission_denied") {
        solution = `Permission denied errors mean your API key doesn't have the required scopes.\n\nTo fix:\n1. Check ${integration} API key permissions\n2. Ensure the key has read access to transactions/orders\n3. Regenerate the key with proper permissions\n4. Update it in Settler`;
      } else {
        solution = `For ${integration} connection issues:\n\n1. Verify your API credentials are correct\n2. Check if ${integration} is experiencing outages\n3. Review integration logs for specific error messages\n4. Try disconnecting and reconnecting the integration\n\nIf issues persist, contact support with the specific error message.`;
      }
    } else if (issue === "job_failed") {
      solution = `Reconciliation job failures can be caused by:\n\n1. Data format mismatches between source and target\n2. Missing required fields in transaction data\n3. Network timeouts or API errors\n4. Invalid matching rules\n\nTo troubleshoot:\n- Check the job logs for specific error messages\n- Verify both integrations are connected and syncing\n- Review your matching rules\n- Try running the job again\n\nIf the issue persists, share the error message with support.`;
    } else if (issue === "slow_performance") {
      solution = `Slow reconciliation performance can be improved by:\n\n1. Reducing the date range for reconciliation\n2. Using more specific matching rules\n3. Ensuring integrations are syncing regularly\n4. Checking for network latency issues\n\nFor large datasets:\n- Consider splitting into smaller batches\n- Use scheduled jobs during off-peak hours\n- Enable Edge AI for local processing if available`;
    } else if (issue === "billing_issue") {
      solution = `For billing issues:\n\n1. Check your payment method in billing settings\n2. Verify your subscription status\n3. Review recent invoices\n4. Contact billing support if payment failed\n\nCommon issues:\n- Expired credit card\n- Insufficient funds\n- Payment processor errors\n\nUpdate your payment method or contact support for assistance.`;
    } else {
      solution = `I understand you're experiencing an issue. To help you better:\n\n1. Check the error logs in your dashboard\n2. Review the documentation for your specific use case\n3. Try the troubleshooting steps in our help center\n4. Contact support with:\n   - What you were trying to do\n   - The exact error message\n   - Steps to reproduce the issue\n\nOur support team can help resolve this quickly.`;
    }

    return NextResponse.json({ solution });
  } catch {
    appLogger.error("Error in troubleshooting POST", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
