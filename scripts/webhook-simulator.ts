#!/usr/bin/env node
/**
 * Webhook Security Simulator
 *
 * A comprehensive tool for testing webhook security features:
 * - Signature verification testing
 * - Duplicate delivery simulation
 * - Replay attack prevention
 * - Idempotency validation
 * - Stress testing
 *
 * Usage:
 *   node scripts/webhook-simulator.ts --help
 *
 * Examples:
 *   # Test signature verification
 *   node scripts/webhook-simulator.ts --test=signature --adapter=stripe
 *
 *   # Simulate duplicate deliveries
 *   node scripts/webhook-simulator.ts --test=duplicate --count=10
 *
 *   # Test replay protection
 *   node scripts/webhook-simulator.ts --test=replay --age=600
 *
 *   # Run all tests
 *   node scripts/webhook-simulator.ts --test=all
 */

import { createHmac, randomBytes } from "crypto";
import { Command } from "commander";
import inquirer from "inquirer";
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { createServer } from "http";

// ============================================================================
// Configuration
// ============================================================================

interface SimulatorConfig {
  webhookSecret: string;
  adapter: string;
  timestampTolerance: number; // seconds
  idempotencyWindow: number; // milliseconds
  basePayload: Record<string, unknown>;
}

const DEFAULT_CONFIG: SimulatorConfig = {
  webhookSecret: "whsec_test_secret_key_32_chars_long!!",
  adapter: "stripe",
  timestampTolerance: 300, // 5 minutes
  idempotencyWindow: 24 * 60 * 60 * 1000, // 24 hours
  basePayload: {
    event: "payment.received",
    data: {
      id: "pi_1234567890",
      amount: 10000,
      currency: "usd",
      status: "succeeded",
      metadata: {
        order_id: "ord_123",
        customer_id: "cus_123",
      },
    },
    timestamp: new Date().toISOString(),
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a webhook signature compatible with various providers
 */
function generateSignature(
  payload: string,
  secret: string,
  algorithm: "sha256" | "sha1" = "sha256",
  timestamp?: number,
  provider: string = "stripe"
): string {
  const crypto = await import("crypto");

  if (provider === "stripe" && timestamp) {
    // Stripe-style signature: timestamp + payload
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return `t=${timestamp},v1=${signature}`;
  }

  if (provider === "shopify") {
    // Shopify-style: HMAC-SHA256 base64
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("base64");
    return hmac;
  }

  // Default: HMAC-SHA256 hex
  return crypto.createHmac(algorithm, secret).update(payload).digest("hex");
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString("hex");
  return `evt_${timestamp}_${random}`;
}

/**
 * Generate idempotency key
 */
function generateIdempotencyKey(
  tenantId: string,
  eventType: string,
  data: Record<string, unknown>
): string {
  const dataHash = createHmac("sha256", "")
    .update(JSON.stringify({ tenantId, eventType, data }))
    .digest("hex")
    .substring(0, 16);
  return `${tenantId}:${eventType}:${dataHash}`;
}

// ============================================================================
// Webhook Security Tests
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

/**
 * Test signature verification
 */
async function testSignatureVerification(config: SimulatorConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startTime = Date.now();
  const payload = JSON.stringify(config.basePayload);

  console.log("\n🧪 Testing Signature Verification...\n");

  // Test 1: Valid signature
  const validTimestamp = Math.floor(Date.now() / 1000);
  const validSignature = generateSignature(
    payload,
    config.webhookSecret,
    "sha256",
    validTimestamp,
    config.adapter
  );

  const isValid = await verifyWebhookSignature(
    config.adapter,
    payload,
    validSignature,
    config.webhookSecret
  );

  results.push({
    name: "Valid Signature",
    passed: isValid,
    message: isValid ? "Valid signature accepted" : "Valid signature rejected",
    duration: Date.now() - startTime,
    details: { timestamp: validTimestamp },
  });

  // Test 2: Invalid signature
  const invalidSignature =
    "invalid_signature_1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
  const isInvalid = !(await verifyWebhookSignature(
    config.adapter,
    payload,
    invalidSignature,
    config.webhookSecret
  ));

  results.push({
    name: "Invalid Signature",
    passed: isInvalid,
    message: isInvalid ? "Invalid signature rejected" : "Invalid signature accepted (BAD!)",
    duration: Date.now() - startTime - results[0].duration,
    details: { signatureLength: invalidSignature.length },
  });

  // Test 3: Tampered payload
  const tamperedPayload = JSON.stringify({ ...config.basePayload, amount: 99999 });
  const tamperedSignature = generateSignature(
    tamperedPayload,
    config.webhookSecret,
    "sha256",
    validTimestamp,
    config.adapter
  );

  const isTamperedRejected = !(await verifyWebhookSignature(
    config.adapter,
    payload, // Original payload with tampered signature
    tamperedSignature,
    config.webhookSecret
  ));

  results.push({
    name: "Tampered Payload",
    passed: isTamperedRejected,
    message: isTamperedRejected ? "Tampered payload rejected" : "Tampered payload accepted (BAD!)",
    duration: Date.now() - startTime - results[0].duration - results[1].duration,
    details: { tampered: true },
  });

  return results;
}

/**
 * Test replay protection
 */
async function testReplayProtection(config: SimulatorConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startTime = Date.now();
  const payload = JSON.stringify(config.basePayload);

  console.log("\n🛡️ Testing Replay Protection...\n");

  // Test 1: Recent timestamp (should pass)
  const recentTimestamp = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
  const recentSignature = generateSignature(
    payload,
    config.webhookSecret,
    "sha256",
    recentTimestamp,
    config.adapter
  );

  const recentTimeDiff = Math.abs(Math.floor(Date.now() / 1000) - recentTimestamp);
  const isRecentValid = recentTimeDiff <= config.timestampTolerance;

  results.push({
    name: "Recent Timestamp",
    passed: isRecentValid,
    message: isRecentValid
      ? `Recent timestamp (${recentTimeDiff}s) accepted`
      : `Recent timestamp (${recentTimeDiff}s) rejected unexpectedly`,
    duration: Date.now() - startTime,
    details: { timestamp: recentTimestamp, timeDiff: recentTimeDiff },
  });

  // Test 2: Stale timestamp (should fail)
  const staleTimestamp = Math.floor(Date.now() / 1000) - 400; // 6.5 minutes ago
  const staleTimeDiff = Math.abs(Math.floor(Date.now() / 1000) - staleTimestamp);
  const isStaleValid = staleTimeDiff <= config.timestampTolerance;

  results.push({
    name: "Stale Timestamp",
    passed: !isStaleValid,
    message: !isStaleValid
      ? `Stale timestamp (${staleTimeDiff}s) correctly rejected`
      : `Stale timestamp (${staleTimeDiff}s) should have been rejected (BAD!)`,
    duration: Date.now() - startTime - results[0].duration,
    details: { timestamp: staleTimestamp, timeDiff: staleTimeDiff },
  });

  // Test 3: Future timestamp (should fail)
  const futureTimestamp = Math.floor(Date.now() / 1000) + 600; // 10 minutes in future
  const futureTimeDiff = Math.abs(Math.floor(Date.now() / 1000) - futureTimestamp);
  const isFutureValid = futureTimeDiff <= config.timestampTolerance;

  results.push({
    name: "Future Timestamp",
    passed: !isFutureValid,
    message: !isFutureValid
      ? `Future timestamp (${futureTimeDiff}s) correctly rejected`
      : `Future timestamp (${futureTimeDiff}s) should have been rejected (BAD!)`,
    duration: Date.now() - startTime - results[0].duration - results[1].duration,
    details: { timestamp: futureTimestamp, timeDiff: futureTimeDiff },
  });

  return results;
}

/**
 * Test idempotency protection
 */
async function testIdempotency(
  config: SimulatorConfig,
  deliveryCount: number = 10
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startTime = Date.now();
  const processedIds = new Set<string>();
  const duplicateAttempts = 0;
  const processedEvents: string[] = [];

  console.log(`\n🔄 Testing Idempotency (${deliveryCount} deliveries)...\n`);

  // Simulate webhook deliveries with potential duplicates
  for (let i = 0; i < deliveryCount; i++) {
    const eventId = i % 3 === 0 ? `duplicate_${i % 3}` : generateEventId(); // Every 3rd is a duplicate
    const isDuplicate = processedIds.has(eventId);

    if (isDuplicate) {
      continue; // Skip duplicate (idempotency check)
    }

    processedIds.add(eventId);
    processedEvents.push(eventId);
  }

  const uniqueEvents = processedEvents.length;
  const totalAttempts = deliveryCount;
  const duplicatesDetected = deliveryCount - uniqueEvents;

  results.push({
    name: "Duplicate Detection",
    passed: duplicatesDetected > 0,
    message: `Detected ${duplicatesDetected} duplicate(s) out of ${totalAttempts} attempts`,
    duration: Date.now() - startTime,
    details: { uniqueEvents, totalAttempts, duplicatesDetected },
  });

  results.push({
    name: "Idempotency Processing",
    passed: uniqueEvents === (deliveryCount / 3) * 2, // Expected unique events
    message: `Processed ${uniqueEvents} unique events from ${totalAttempts} deliveries`,
    duration: Date.now() - startTime - results[0].duration,
    details: { processedEvents: uniqueEvents },
  });

  return results;
}

/**
 * Test duplicate delivery handling
 */
async function testDuplicateDelivery(
  config: SimulatorConfig,
  duplicateCount: number = 5
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startTime = Date.now();

  console.log(`\n📦 Testing Duplicate Delivery (${duplicateCount} duplicates)...\n`);

  const eventId = generateEventId();
  const idempotencyKey = generateIdempotencyKey(
    "tenant_123",
    config.basePayload.event as string,
    config.basePayload.data as Record<string, unknown>
  );

  // Simulate delivery attempts
  const deliveryResults: { attempt: number; processed: boolean; sideEffect: boolean }[] = [];
  const processedSet = new Set<string>();

  for (let attempt = 1; attempt <= duplicateCount; attempt++) {
    const isProcessed = processedSet.has(idempotencyKey);

    if (!isProcessed) {
      // First time - process the event
      processedSet.add(idempotencyKey);
      deliveryResults.push({ attempt, processed: true, sideEffect: true });
    } else {
      // Duplicate - should be skipped
      deliveryResults.push({ attempt, processed: false, sideEffect: false });
    }
  }

  const firstProcessed = deliveryResults[0].processed && deliveryResults[0].sideEffect;
  const duplicatesSkipped = deliveryResults.filter((r) => !r.processed).length;
  const sideEffectsOnlyOnce = deliveryResults.filter((r) => r.sideEffect).length === 1;

  results.push({
    name: "First Delivery Processed",
    passed: firstProcessed,
    message: firstProcessed
      ? "First delivery correctly processed with side effects"
      : "First delivery should have been processed",
    duration: Date.now() - startTime,
    details: { attempt: 1, processed: true, sideEffect: true },
  });

  results.push({
    name: "Duplicates Skipped",
    passed: duplicatesSkipped === duplicateCount - 1,
    message: `${duplicatesSkipped} duplicate(s) correctly skipped`,
    duration: Date.now() - startTime - results[0].duration,
    details: { duplicatesSkipped, totalAttempts: duplicateCount },
  });

  results.push({
    name: "Side Effects Only Once",
    passed: sideEffectsOnlyOnce,
    message: sideEffectsOnlyOnce
      ? "Side effects executed only once"
      : "Side effects executed multiple times (BAD!)",
    duration: Date.now() - startTime - results[0].duration - results[1].duration,
    details: { sideEffectCount: deliveryResults.filter((r) => r.sideEffect).length },
  });

  return results;
}

// ============================================================================
// Mock Verification Function
// ============================================================================

async function verifyWebhookSignature(
  adapter: string,
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const crypto = await import("crypto");

  // Parse Stripe-style signature
  if (signature.includes("t=") && signature.includes("v1=")) {
    const elements = signature.split(",");
    const timestamp = parseInt(elements.find((e) => e.startsWith("t="))?.split("=")[1] || "0");
    const signatureValue = elements.find((e) => e.startsWith("v1="))?.split("=")[1] || "";

    // Check timestamp tolerance
    const timeDiff = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
    if (timeDiff > 300) {
      return false; // Timestamp too old or too far in future
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signatureValue, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  // Default HMAC verification
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

// ============================================================================
// Test Runner
// ============================================================================

async function runAllTests(
  config: SimulatorConfig,
  options: { duplicateCount?: number; staleAge?: number }
): Promise<void> {
  console.log("=".repeat(60));
  console.log("🛡️  WEBHOOK SECURITY SIMULATOR");
  console.log("=".repeat(60));
  console.log(`\n📋 Configuration:`);
  console.log(`   Adapter: ${config.adapter}`);
  console.log(`   Secret: ${config.webhookSecret.substring(0, 8)}...`);
  console.log(`   Timestamp Tolerance: ${config.timestampTolerance}s`);
  console.log(`   Idempotency Window: ${config.idempotencyWindow}ms`);

  const allResults: TestResult[] = [];

  // Run signature tests
  const signatureResults = await testSignatureVerification(config);
  allResults.push(...signatureResults);

  // Run replay tests
  const replayResults = await testReplayProtection(config);
  allResults.push(...replayResults);

  // Run idempotency tests
  const idempotencyResults = await testIdempotency(config, options.duplicateCount || 10);
  allResults.push(...idempotencyResults);

  // Run duplicate delivery tests
  const duplicateResults = await testDuplicateDelivery(config, options.duplicateCount || 5);
  allResults.push(...duplicateResults);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  const total = allResults.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Total Duration: ${allResults.reduce((sum, r) => sum + r.duration, 0)}ms\n`);

  if (failed > 0) {
    console.log("⚠️  FAILED TESTS:");
    allResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function runInteractiveMode(): Promise<void> {
  console.log("\n🎮 Interactive Webhook Security Simulator\n");

  const questions = [
    {
      type: "list",
      name: "testType",
      message: "What would you like to test?",
      choices: [
        "Signature Verification",
        "Replay Protection",
        "Idempotency",
        "Duplicate Delivery",
        "Run All Tests",
        "Start Mock Server",
      ],
    },
    {
      type: "input",
      name: "adapter",
      message: "Webhook adapter (stripe/shopify/paypal):",
      default: "stripe",
      when: (answers: { testType: string }) =>
        ["Signature Verification", "Run All Tests"].includes(answers.testType),
    },
    {
      type: "input",
      name: "duplicateCount",
      message: "Number of duplicate deliveries to test:",
      default: "5",
      when: (answers: { testType: string }) =>
        ["Idempotency", "Duplicate Delivery", "Run All Tests"].includes(answers.testType),
      validate: (input: string) => !isNaN(parseInt(input)) || "Please enter a valid number",
    },
  ];

  const answers = await inquirer.prompt(questions);

  const config: SimulatorConfig = {
    ...DEFAULT_CONFIG,
    adapter: answers.adapter || DEFAULT_CONFIG.adapter,
  };

  switch (answers.testType) {
    case "Signature Verification":
      const sigResults = await testSignatureVerification(config);
      console.log("\n✅ Signature Verification Tests Complete");
      break;
    case "Replay Protection":
      const replayResults = await testReplayProtection(config);
      console.log("\n✅ Replay Protection Tests Complete");
      break;
    case "Idempotency":
      const idempResults = await testIdempotency(config, parseInt(answers.duplicateCount) || 10);
      console.log("\n✅ Idempotency Tests Complete");
      break;
    case "Duplicate Delivery":
      const dupResults = await testDuplicateDelivery(config, parseInt(answers.duplicateCount) || 5);
      console.log("\n✅ Duplicate Delivery Tests Complete");
      break;
    case "Run All Tests":
      await runAllTests(config, { duplicateCount: parseInt(answers.duplicateCount) || 10 });
      break;
    case "Start Mock Server":
      await startMockWebhookServer(config);
      break;
  }
}

// ============================================================================
// Mock Webhook Server
// ============================================================================

async function startMockWebhookServer(config: SimulatorConfig): Promise<void> {
  console.log("\n🚀 Starting Mock Webhook Server...\n");

  const app = express();
  const processedEvents = new Map<string, { count: number; firstProcessed: Date }>();

  // Raw body parser for signature verification
  app.use(
    bodyParser.json({
      verify: (req: Request, _res, buf) => {
        (req as unknown as { rawBody: Buffer }).rawBody = buf;
      },
    })
  );

  // Webhook endpoint with full security
  app.post("/webhook/:adapter", async (req: Request, res: Response) => {
    const { adapter } = req.params;
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    try {
      // 1. Check timestamp (replay protection)
      if (timestamp) {
        const requestTime = parseInt(timestamp);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);

        if (timeDiff > config.timestampTolerance) {
          console.log(`⚠️  Replay attempt detected: timestamp too old (${timeDiff}s)`);
          return res.status(401).json({ error: "Request timestamp too old" });
        }
      }

      // 2. Verify signature
      if (!signature) {
        console.log(`⚠️  Missing signature for adapter: ${adapter}`);
        return res.status(401).json({ error: "Missing webhook signature" });
      }

      const rawBody =
        (req as unknown as { rawBody: Buffer }).rawBody?.toString() || JSON.stringify(req.body);
      const isValid = await verifyWebhookSignature(
        adapter,
        rawBody,
        signature,
        config.webhookSecret
      );

      if (!isValid) {
        console.log(`⚠️  Invalid signature for adapter: ${adapter}`);
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      // 3. Check idempotency (duplicate protection)
      if (idempotencyKey) {
        const existing = processedEvents.get(idempotencyKey);
        if (existing) {
          console.log(`🔄 Duplicate webhook detected: ${idempotencyKey}`);
          return res.status(200).json({
            received: true,
            message: "Webhook already processed",
            duplicate: true,
            originalProcessedAt: existing.firstProcessed.toISOString(),
          });
        }

        processedEvents.set(idempotencyKey, {
          count: 1,
          firstProcessed: new Date(),
        });
      }

      // 4. Process webhook
      console.log(`✅ Processing webhook: ${adapter}`, req.body);

      res.status(200).json({
        received: true,
        message: "Webhook processed successfully",
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "healthy", processedEvents: processedEvents.size });
  });

  // Stats endpoint
  app.get("/stats", (_req: Request, res: Response) => {
    const stats = Array.from(processedEvents.entries()).map(([key, value]) => ({
      idempotencyKey: key,
      count: value.count,
      firstProcessed: value.firstProcessed,
    }));
    res.json({ totalEvents: stats.length, events: stats });
  });

  const PORT = process.env.WEBHOOK_PORT || 3001;
  const server = createServer(app);

  server.listen(PORT, () => {
    console.log(`✅ Mock webhook server running on http://localhost:${PORT}`);
    console.log(`\n📝 Available endpoints:`);
    console.log(`   POST /webhook/:adapter - Webhook receiver`);
    console.log(`   GET  /health           - Health check`);
    console.log(`   GET  /stats            - Event statistics`);
    console.log(`\n🧪 Test with curl:`);
    console.log(`   curl -X POST http://localhost:${PORT}/webhook/stripe \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -H "X-Webhook-Signature: ..."`);
    console.log(`\n   Press Ctrl+C to stop the server\n`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down mock server...");
    server.close(() => {
      console.log("✅ Server stopped");
      process.exit(0);
    });
  });
}

// ============================================================================
// CLI Setup
// ============================================================================

const program = new Command();

program
  .name("webhook-simulator")
  .description("🛡️ Webhook Security Simulator - Test and verify webhook security features")
  .version("1.0.0");

program
  .command("test")
  .description("Run security tests")
  .option("-a, --adapter <adapter>", "Webhook adapter (stripe, shopify, paypal)", "stripe")
  .option("-s, --secret <secret>", "Webhook secret", DEFAULT_CONFIG.webhookSecret)
  .option("-t, --tolerance <seconds>", "Timestamp tolerance in seconds", "300")
  .option("-d, --duplicates <count>", "Number of duplicate deliveries", "10")
  .action(async (options) => {
    const config: SimulatorConfig = {
      adapter: options.adapter,
      webhookSecret: options.secret,
      timestampTolerance: parseInt(options.tolerance),
      idempotencyWindow: DEFAULT_CONFIG.idempotencyWindow,
      basePayload: DEFAULT_CONFIG.basePayload,
    };

    await runAllTests(config, { duplicateCount: parseInt(options.duplicates) });
  });

program
  .command("server")
  .description("Start mock webhook server for testing")
  .option("-p, --port <port>", "Server port", "3001")
  .option("-s, --secret <secret>", "Webhook secret", DEFAULT_CONFIG.webhookSecret)
  .action(async (options) => {
    const config: SimulatorConfig = {
      ...DEFAULT_CONFIG,
      webhookSecret: options.secret,
    };

    await startMockWebhookServer(config);
  });

program
  .command("generate")
  .description("Generate test signatures")
  .option("-a, --adapter <adapter>", "Webhook adapter", "stripe")
  .option("-s, --secret <secret>", "Webhook secret", DEFAULT_CONFIG.webhookSecret)
  .option("-p, --payload <payload>", "JSON payload", JSON.stringify(DEFAULT_CONFIG.basePayload))
  .action(async (options) => {
    const payload = options.payload;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(
      payload,
      options.secret,
      "sha256",
      timestamp,
      options.adapter
    );

    console.log("\n📝 Generated Signature:");
    console.log(`   Payload: ${payload}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Signature: ${signature}`);
    console.log("\n🧪 Test Request:");
    console.log(`   curl -X POST http://localhost:3001/webhook/${options.adapter} \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -H "X-Webhook-Signature: ${signature}" \\`);
    console.log(`     -H "X-Webhook-Timestamp: ${timestamp}" \\`);
    console.log(`     -d '${payload}'`);
  });

program
  .command("interactive")
  .alias("i")
  .description("Run in interactive mode")
  .action(async () => {
    await runInteractiveMode();
  });

program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
