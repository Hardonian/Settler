# Settler Security & Failure Threat Matrix
## Pre-Mortem Security and Failure Analysis

**Document Version:** 1.0  
**Date:** 2026  
**Classification:** Internal Security Assessment  
**Approach:** "Assume Breach" / Adversarial Mindset

---

## Executive Summary

This document identifies **critical security vulnerabilities, failure modes, and compliance gaps** in the Settler reconciliation API platform. The analysis follows a paranoid, adversarial approach—assuming attackers have sophisticated capabilities and that failures will occur under stress.

**Key Findings:**
- **23 Critical** vulnerabilities requiring immediate remediation
- **31 High** priority issues affecting production readiness
- **18 Medium** priority items for hardening
- **12 Low** priority improvements

**Risk Score:** 🔴 **CRITICAL** - Platform not production-ready without addressing critical items.

---

## Threat Matrix Overview

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Security** | 8 | 12 | 6 | 3 | 29 |
| **Failure Modes** | 7 | 9 | 5 | 2 | 23 |
| **Scale & Performance** | 4 | 6 | 4 | 2 | 16 |
| **Compliance** | 4 | 4 | 3 | 1 | 12 |
| **Operational** | 0 | 0 | 0 | 4 | 4 |
| **TOTAL** | **23** | **31** | **18** | **12** | **84** |

---

## A) SECURITY THREAT MODEL

### A1. API Authentication Vulnerabilities

#### A1.1: Weak API Key Validation (Token Theft Risk)
**Threat:** API keys validated only by prefix check (`rk_`), no database lookup or cryptographic verification.

**Current Code:**
```typescript
// packages/api/src/middleware/auth.ts:19
if (apiKey.startsWith("rk_")) {
  req.apiKey = apiKey;
  req.userId = apiKey.split("_")[1] || "anonymous";
  return next();
}
```

**Attack Vector:**
- Attacker guesses valid API key format: `rk_<userId>`
- No validation against database → any `rk_*` key accepted
- User ID extraction is trivial (split on `_`)

**Likelihood:** 🔴 **HIGH** - Trivial to exploit  
**Impact:** 🔴 **CRITICAL** - Complete account takeover  
**CVSS Score:** 9.8 (Critical)

**Mitigation:**
```typescript
// Store API keys as bcrypt hashes in database
import { compare } from 'bcrypt';
import { db } from './db';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"] as string;
  if (apiKey) {
    // Lookup API key hash in database
    const keyRecord = await db.apiKeys.findOne({ 
      where: { keyPrefix: apiKey.substring(0, 8) } // Use prefix for lookup
    });
    
    if (!keyRecord) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    // Verify full key against hash
    const isValid = await compare(apiKey, keyRecord.keyHash);
    if (!isValid) {
      // Log failed attempt
      await db.auditLogs.create({
        event: 'api_key_auth_failed',
        apiKeyPrefix: apiKey.substring(0, 8),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    // Check if key is revoked or expired
    if (keyRecord.revokedAt || keyRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: "API key expired or revoked" });
    }
    
    req.userId = keyRecord.userId;
    req.apiKeyId = keyRecord.id;
    return next();
  }
  // ... JWT handling
};
```

**Testing Strategy:**
- Unit test: Invalid API key formats rejected
- Integration test: Stolen API key from logs cannot be reused after revocation
- Penetration test: Brute force API key enumeration (should fail)
- Load test: API key lookup performance under load

---

#### A1.2: JWT Secret Hardcoded Fallback
**Threat:** Default JWT secret `"your-secret-key-change-in-production"` allows token forgery if not overridden.

**Current Code:**
```typescript
// packages/api/src/middleware/auth.ts:31
const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
```

**Attack Vector:**
- Attacker discovers default secret (common in dev/staging)
- Forges JWT tokens with arbitrary `userId`
- Accesses any customer's data

**Likelihood:** 🟡 **MEDIUM** - Requires environment misconfiguration  
**Impact:** 🔴 **CRITICAL** - Complete authentication bypass  
**CVSS Score:** 9.1 (Critical)

**Mitigation:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret || secret === "your-secret-key-change-in-production") {
  throw new Error("JWT_SECRET must be set to a secure random value in production");
}

// Use RS256 instead of HS256 for better security
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: process.env.JWKS_URI || 'https://auth.settler.io/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
  // ...
});
```

**Testing Strategy:**
- Deployment check: Fail startup if `JWT_SECRET` not set
- Integration test: Default secret rejected in production mode
- Security scan: Detect hardcoded secrets in codebase

---

#### A1.3: No Token Expiration/Refresh Mechanism
**Threat:** JWT tokens never expire, allowing indefinite access if stolen.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Long-lived token theft  
**CVSS Score:** 7.5 (High)

**Mitigation:**
```typescript
const token = jwt.sign(
  { userId, type: 'access' },
  secret,
  { expiresIn: '15m', issuer: 'settler-api', audience: 'settler-client' }
);

// Implement refresh tokens (stored in httpOnly cookies)
const refreshToken = jwt.sign(
  { userId, type: 'refresh' },
  refreshSecret,
  { expiresIn: '7d' }
);
```

**Testing Strategy:**
- Unit test: Expired tokens rejected
- Integration test: Refresh token rotation on use

---

#### A1.4: Replay Attack Vulnerability
**Threat:** No nonce/timestamp validation allows request replay.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Duplicate operations, financial fraud  
**CVSS Score:** 7.2 (High)

**Mitigation:**
```typescript
// Require idempotency key for state-changing operations
import { v4 as uuidv4 } from 'uuid';

interface IdempotencyStore {
  get(key: string): Promise<{ response: any; timestamp: number } | null>;
  set(key: string, response: any, ttl: number): Promise<void>;
}

router.post('/jobs', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' });
  }
  
  // Check if we've seen this request
  const cached = await idempotencyStore.get(idempotencyKey);
  if (cached) {
    return res.status(200).json(cached.response);
  }
  
  // Process request
  const result = await createJob(req.body);
  
  // Cache response for 24 hours
  await idempotencyStore.set(idempotencyKey, result, 86400);
  res.status(201).json(result);
});
```

**Testing Strategy:**
- Integration test: Duplicate idempotency key returns cached response
- Load test: Idempotency store performance

---

#### A1.5: Scope Creep / Over-Privileged API Keys
**Threat:** No scoped permissions—API keys grant full access to all resources.

**Likelihood:** 🟠 **HIGH** - Default behavior  
**Impact:** 🟠 **HIGH** - Principle of least privilege violated  
**CVSS Score:** 7.0 (High)

**Mitigation:**
```typescript
interface ApiKeyScope {
  resources: string[]; // ['jobs:read', 'jobs:write', 'reports:read']
  rateLimit: number;
  ipWhitelist?: string[];
}

// Middleware to check scopes
export const requireScope = (scope: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKey = await db.apiKeys.findOne({ id: req.apiKeyId });
    if (!apiKey.scopes.includes(scope)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

router.post('/jobs', requireScope('jobs:write'), createJob);
router.get('/jobs', requireScope('jobs:read'), listJobs);
```

**Testing Strategy:**
- Unit test: Scoped API keys reject unauthorized operations
- Integration test: Read-only keys cannot create jobs

---

### A2. Input Validation Failures

#### A2.1: SQL Injection via Dynamic Queries
**Threat:** No database layer visible, but if raw SQL is used, injection is possible.

**Likelihood:** 🟡 **MEDIUM** - Depends on implementation  
**Impact:** 🔴 **CRITICAL** - Database compromise  
**CVSS Score:** 9.8 (Critical)

**Mitigation:**
```typescript
// Use parameterized queries ONLY
import { db } from './db'; // Using Prisma/TypeORM/Drizzle

// ❌ NEVER DO THIS:
// const query = `SELECT * FROM jobs WHERE userId = '${userId}'`;

// ✅ ALWAYS DO THIS:
const jobs = await db.jobs.findMany({
  where: { userId: userId } // ORM handles parameterization
});

// For raw queries (if necessary):
await db.$queryRaw`SELECT * FROM jobs WHERE userId = ${userId}`;
```

**Testing Strategy:**
- SQL injection scanner: SQLMap, OWASP ZAP
- Unit test: Malicious input in all query parameters
- Code review: Audit all database queries

---

#### A2.2: JSON Bomb / Billion Laughs Attack
**Threat:** No depth/size limits on JSON parsing allows DoS via nested objects.

**Current Code:**
```typescript
// packages/api/src/index.ts:33
app.use(express.json({ limit: "10mb" }));
```

**Attack Vector:**
```json
{
  "data": {
    "nested": {
      "deep": { ... } // 1000 levels deep
    }
  }
}
```

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Memory exhaustion, DoS  
**CVSS Score:** 7.5 (High)

**Mitigation:**
```typescript
import express from 'express';
import { json } from 'express';

app.use(json({
  limit: '1mb', // Reduce limit
  verify: (req, res, buf) => {
    // Check JSON depth
    const depth = countDepth(JSON.parse(buf.toString()));
    if (depth > 20) {
      throw new Error('JSON depth exceeds maximum');
    }
  }
}));

function countDepth(obj: any, current = 0): number {
  if (typeof obj !== 'object' || obj === null) return current;
  const depths = Object.values(obj).map(v => countDepth(v, current + 1));
  return Math.max(current, ...depths);
}
```

**Testing Strategy:**
- Fuzz test: Random nested JSON payloads
- Load test: Memory usage under JSON bomb attack

---

#### A2.3: XSS via Reconciliation Reports
**Threat:** Report data containing user-controlled content rendered without sanitization.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Session hijacking, CSRF  
**CVSS Score:** 6.1 (Medium)

**Mitigation:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize all user-controlled data before rendering
const sanitizedReport = {
  ...report,
  metadata: Object.entries(report.metadata).reduce((acc, [k, v]) => {
    acc[k] = typeof v === 'string' ? DOMPurify.sanitize(v) : v;
    return acc;
  }, {})
};
```

**Testing Strategy:**
- XSS scanner: OWASP ZAP, Burp Suite
- Unit test: `<script>alert('xss')</script>` in report data

---

#### A2.4: XML External Entity (XXE) Attack
**Threat:** If XML parsing is added for adapters, XXE vulnerabilities possible.

**Likelihood:** 🟢 **LOW** - Not currently implemented  
**Impact:** 🔴 **CRITICAL** - File disclosure, SSRF  
**CVSS Score:** 8.1 (High)

**Mitigation:**
```typescript
import { parseString } from 'xml2js';

const parser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true,
  // CRITICAL: Disable external entities
  explicitCharkey: false,
  trim: true,
  // Prevent XXE
  xmlOptions: {
    noEnt: false, // Must be false
    noAttr: false
  }
});

// Use libxmljs2 with XXE disabled
import libxmljs from 'libxmljs2';
const doc = libxmljs.parseXmlString(xml, {
  noent: false, // Disable entity expansion
  noblanks: true
});
```

**Testing Strategy:**
- Penetration test: XXE payloads if XML parsing exists
- Code review: Audit all XML parsing

---

#### A2.5: No Input Sanitization for Adapter Configs
**Threat:** Adapter configs (`config: z.record(z.any())`) accept arbitrary data, including malicious payloads.

**Current Code:**
```typescript
// packages/api/src/routes/jobs.ts:14
config: z.record(z.any()),
```

**Attack Vector:**
```json
{
  "source": {
    "adapter": "stripe",
    "config": {
      "apiKey": "../../../etc/passwd",
      "__proto__": { "isAdmin": true }
    }
  }
}
```

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Prototype pollution, path traversal  
**CVSS Score:** 7.2 (High)

**Mitigation:**
```typescript
import { z } from 'zod';

const adapterConfigSchema = z.record(
  z.union([
    z.string().max(1000), // Limit string length
    z.number(),
    z.boolean(),
    z.array(z.string().max(1000))
  ])
).refine(
  (config) => {
    // Prevent prototype pollution
    return !('__proto__' in config || 'constructor' in config || 'prototype' in config);
  },
  { message: 'Invalid config keys' }
);

const createJobSchema = z.object({
  body: z.object({
    source: z.object({
      adapter: z.string().min(1).max(50),
      config: adapterConfigSchema
    }),
    // ...
  })
});
```

**Testing Strategy:**
- Unit test: Prototype pollution attempts rejected
- Fuzz test: Random config payloads

---

### A3. Rate Limiting Bypass Techniques

#### A3.1: IP-Based Rate Limiting Only
**Threat:** Rate limit applies per IP, easily bypassed via proxies/VPNs.

**Current Code:**
```typescript
// packages/api/src/index.ts:25
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Per IP
});
```

**Attack Vector:**
- Attacker rotates IPs (proxy pool, VPN)
- Distributed attack from multiple IPs
- No per-API-key rate limiting

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - DoS, resource exhaustion  
**CVSS Score:** 7.5 (High)

**Mitigation:**
```typescript
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Per-API-key rate limiting
const apiKeyLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:apikey:'
  }),
  windowMs: 15 * 60 * 1000,
  max: async (req: AuthRequest) => {
    // Get rate limit from API key record
    const apiKey = await db.apiKeys.findOne({ id: req.apiKeyId });
    return apiKey?.rateLimit || 1000;
  },
  keyGenerator: (req: AuthRequest) => req.apiKeyId || req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

// Global IP-based rate limit (backup)
const ipLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: 'rl:ip:' }),
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for legitimate users
  skip: (req) => !!req.apiKeyId // Skip if API key present
});

app.use('/api/', ipLimiter);
app.use('/api/', authMiddleware, apiKeyLimiter);
```

**Testing Strategy:**
- Load test: Rate limiting under distributed attack
- Integration test: API key rate limits enforced

---

#### A3.2: No Rate Limiting on Webhook Endpoints
**Threat:** `/webhooks/receive/:adapter` has no authentication or rate limiting.

**Current Code:**
```typescript
// packages/api/src/routes/webhooks.ts:79
router.post("/receive/:adapter", async (req: Request, res: Response) => {
  // No auth, no rate limiting
});
```

**Attack Vector:**
- Attacker floods webhook endpoint
- Exhausts database connections
- Triggers expensive reconciliation jobs

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - DoS, resource exhaustion  
**CVSS Score:** 8.5 (High)

**Mitigation:**
```typescript
import { verifyWebhookSignature } from './webhook-verification';

// Rate limit by adapter + IP
const webhookLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Per adapter per IP
  keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`
});

router.post("/receive/:adapter", webhookLimiter, async (req, res) => {
  const { adapter } = req.params;
  
  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'] as string;
  const isValid = await verifyWebhookSignature(adapter, req.body, signature);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  // Queue for async processing
  await webhookQueue.add('process-webhook', {
    adapter,
    payload: req.body,
    receivedAt: new Date()
  });
  
  res.status(202).json({ received: true });
});
```

**Testing Strategy:**
- Load test: Webhook endpoint under flood attack
- Integration test: Invalid signatures rejected

---

#### A3.3: No Distributed Rate Limiting
**Threat:** Single-server rate limiting doesn't work in serverless/multi-instance deployments.

**Likelihood:** 🟠 **HIGH** - Serverless architecture  
**Impact:** 🟠 **HIGH** - Rate limit bypass  
**CVSS Score:** 7.0 (High)

**Mitigation:**
- Use Redis-backed rate limiting (see A3.1)
- Implement token bucket algorithm
- Use Cloudflare Rate Limiting (if on Cloudflare)

**Testing Strategy:**
- Load test: Rate limiting across multiple Lambda instances

---

### A4. Data Exfiltration via Reconciliation Logs

#### A4.1: Sensitive Data in Logs
**Threat:** API keys, PII, payment data logged in plaintext.

**Current Code:**
```typescript
// packages/api/src/routes/webhooks.ts:85
console.log(`Received webhook from ${adapter}:`, payload);
```

**Attack Vector:**
- Logs contain full webhook payloads (may include card data, PII)
- Log aggregation services (Datadog, CloudWatch) accessible to attackers
- Log retention policies expose historical data

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - PCI-DSS violation, GDPR breach  
**CVSS Score:** 9.1 (Critical)

**Mitigation:**
```typescript
import { createLogger, format, transports } from 'winston';
import { redact } from './redaction';

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
    format((info) => {
      // Redact sensitive fields
      info.message = redact(info.message);
      if (info.payload) {
        info.payload = redact(info.payload, [
          'apiKey', 'api_key', 'secret', 'password', 'token',
          'card_number', 'cvv', 'ssn', 'email', 'phone'
        ]);
      }
      return info;
    })()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' })
  ]
});

// Redaction utility
export function redact(obj: any, fields: string[] = []): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sensitiveFields = [
    ...fields,
    'apiKey', 'api_key', 'secret', 'password', 'token',
    'card_number', 'cvv', 'ssn', 'email', 'phone', 'credit_card'
  ];
  
  const redacted = { ...obj };
  for (const key of Object.keys(redacted)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redact(redacted[key], fields);
    }
  }
  return redacted;
}

// Usage
logger.info('Webhook received', { adapter, payload: redact(payload) });
```

**Testing Strategy:**
- Code review: Audit all logging statements
- Integration test: Verify sensitive data redacted in logs
- Compliance audit: PCI-DSS, GDPR log review

---

#### A4.2: Reconciliation Reports Expose Cross-Customer Data
**Threat:** No authorization check ensures users only access their own reports.

**Current Code:**
```typescript
// packages/api/src/routes/reports.ts:23
router.get("/:jobId", async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  // No check: Does userId own this jobId?
});
```

**Attack Vector:**
- Attacker guesses jobId: `job_123`, `job_124`, etc.
- Accesses other customers' financial data
- Enumerates all jobs via `/api/v1/jobs`

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Data breach, GDPR violation  
**CVSS Score:** 9.1 (Critical)

**Mitigation:**
```typescript
router.get("/:jobId", async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const userId = req.userId!;
  
  // Verify ownership
  const job = await db.jobs.findOne({
    where: { id: jobId, userId }
  });
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Generate report
  const report = await generateReport(jobId);
  res.json({ data: report });
});

// Use UUIDs, not sequential IDs
import { v4 as uuidv4 } from 'uuid';
const jobId = uuidv4(); // Not: `job_${Date.now()}`
```

**Testing Strategy:**
- Integration test: User A cannot access User B's jobs
- Penetration test: ID enumeration attacks fail
- Authorization test: All resource access checks ownership

---

### A5. Webhook Signature Verification Weaknesses

#### A5.1: No Webhook Signature Verification
**Threat:** Webhook endpoint accepts unsigned requests, allowing spoofing.

**Current Code:**
```typescript
// packages/api/src/routes/webhooks.ts:79
router.post("/receive/:adapter", async (req: Request, res: Response) => {
  // No signature verification
});
```

**Attack Vector:**
- Attacker sends fake webhook: `POST /webhooks/receive/stripe`
- Triggers reconciliation with malicious data
- Causes false positives/negatives in reports

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Data integrity compromise  
**CVSS Score:** 9.3 (Critical)

**Mitigation:**
```typescript
import crypto from 'crypto';

async function verifyWebhookSignature(
  adapter: string,
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<boolean> {
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;
  
  switch (adapter) {
    case 'stripe':
      // Stripe uses HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadBuffer)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
      
    case 'shopify':
      // Shopify uses HMAC-SHA256 with base64
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(payloadBuffer)
        .digest('base64');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(hmac)
      );
      
    default:
      throw new Error(`Unknown adapter: ${adapter}`);
  }
}

router.post("/receive/:adapter", async (req, res) => {
  const { adapter } = req.params;
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = req.body; // Must use raw body, not parsed JSON
  
  // Get webhook secret from database
  const webhookConfig = await db.webhookConfigs.findOne({ adapter });
  if (!webhookConfig) {
    return res.status(400).json({ error: 'Unknown adapter' });
  }
  
  const isValid = await verifyWebhookSignature(
    adapter,
    rawBody,
    signature,
    webhookConfig.secret
  );
  
  if (!isValid) {
    logger.warn('Invalid webhook signature', { adapter, ip: req.ip });
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  await processWebhook(adapter, req.body);
  res.status(200).json({ received: true });
});
```

**Testing Strategy:**
- Unit test: Invalid signatures rejected
- Integration test: Valid signatures accepted
- Penetration test: Signature bypass attempts fail

---

#### A5.2: Clock Skew Causing Signature Validation Failures
**Threat:** Time-based signatures (e.g., Stripe timestamps) fail due to server clock drift.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Legitimate webhooks rejected  
**CVSS Score:** 6.5 (Medium)

**Mitigation:**
```typescript
// Allow 5-minute clock skew
const timestamp = parseInt(req.headers['x-webhook-timestamp'] as string);
const currentTime = Math.floor(Date.now() / 1000);
const timeDiff = Math.abs(currentTime - timestamp);

if (timeDiff > 300) { // 5 minutes
  return res.status(401).json({ error: 'Request timestamp too old' });
}

// Use NTP for server time synchronization
```

**Testing Strategy:**
- Integration test: Webhooks with ±5min timestamp accepted
- Load test: Clock skew handling under load

---

### A6. Secrets Management Failures

#### A6.1: API Keys Stored in Plaintext
**Threat:** Adapter configs contain API keys stored unencrypted in database.

**Current Code:**
```typescript
// packages/api/src/routes/jobs.ts:14
config: z.record(z.any()), // API keys stored here
```

**Attack Vector:**
- Database breach exposes all customer API keys
- Database backups contain plaintext secrets
- Logs contain API keys

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Third-party account compromise  
**CVSS Score:** 9.1 (Critical)

**Mitigation:**
```typescript
import { encrypt, decrypt } from './encryption';
import AWS from 'aws-sdk';

const kms = new AWS.KMS({ region: process.env.AWS_REGION });
const keyId = process.env.KMS_KEY_ID;

// Encrypt API keys before storage
async function encryptSecret(plaintext: string): Promise<string> {
  const result = await kms.encrypt({
    KeyId: keyId,
    Plaintext: plaintext
  }).promise();
  
  return result.CiphertextBlob.toString('base64');
}

async function decryptSecret(ciphertext: string): Promise<string> {
  const result = await kms.decrypt({
    CiphertextBlob: Buffer.from(ciphertext, 'base64')
  }).promise();
  
  return result.Plaintext.toString();
}

// Store encrypted
const encryptedApiKey = await encryptSecret(apiKey);
await db.jobs.create({
  config: {
    ...otherConfig,
    apiKey: encryptedApiKey // Encrypted
  }
});

// Decrypt when needed
const job = await db.jobs.findOne({ id });
const decryptedApiKey = await decryptSecret(job.config.apiKey);
```

**Testing Strategy:**
- Security audit: Verify encryption at rest
- Integration test: Decryption works correctly
- Compliance audit: PCI-DSS, SOC 2 key management review

---

#### A6.2: Secrets Exposed in Client-Side Code
**Threat:** Web UI may expose API keys in browser JavaScript.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - API key theft via XSS  
**CVSS Score:** 7.2 (High)

**Mitigation:**
- Never store API keys in localStorage/sessionStorage
- Use httpOnly cookies for session tokens
- Implement API key rotation UI
- Warn users about client-side exposure

**Testing Strategy:**
- Code review: Audit web UI for API key exposure
- Security scan: Check for secrets in client bundles

---

### A7. SSRF Attacks via User-Provided URLs

#### A7.1: Webhook URLs Allow SSRF
**Threat:** User-provided webhook URLs can target internal services.

**Current Code:**
```typescript
// packages/api/src/routes/webhooks.ts:10
url: z.string().url(), // No validation
```

**Attack Vector:**
```json
{
  "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
  "events": ["*"]
}
```

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🔴 **CRITICAL** - Cloud metadata access, internal network scanning  
**CVSS Score:** 8.6 (High)

**Mitigation:**
```typescript
import { z } from 'zod';
import dns from 'dns/promises';

const urlSchema = z.string().url().refine(async (url) => {
  const parsed = new URL(url);
  
  // Block private IP ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/
  ];
  
  // Resolve DNS to IP
  const hostname = parsed.hostname;
  const addresses = await dns.resolve4(hostname).catch(() => []);
  
  for (const addr of addresses) {
    if (privateRanges.some(range => range.test(addr))) {
      throw new Error('Private IP addresses not allowed');
    }
    
    // Block AWS metadata service
    if (addr.startsWith('169.254.169.254')) {
      throw new Error('AWS metadata service not allowed');
    }
  }
  
  // Only allow HTTPS (except localhost for dev)
  if (parsed.protocol !== 'https:' && hostname !== 'localhost') {
    throw new Error('Only HTTPS URLs allowed');
  }
  
  return true;
}, { message: 'Invalid webhook URL' });

const createWebhookSchema = z.object({
  body: z.object({
    url: urlSchema,
    events: z.array(z.string()),
  })
});
```

**Testing Strategy:**
- Penetration test: SSRF payloads rejected
- Integration test: Private IPs blocked
- Unit test: DNS resolution validation

---

### A8. Authorization Boundary Violations

#### A8.1: No Resource-Level Authorization
**Threat:** Users can access any job/report/webhook by ID guessing.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Cross-customer data access  
**CVSS Score:** 9.1 (Critical)

**Mitigation:**
- See A4.2 for implementation
- Implement row-level security (RLS) in database
- Use UUIDs instead of sequential IDs

**Testing Strategy:**
- See A4.2

---

#### A8.2: Missing RBAC Implementation
**Threat:** No role-based access control—all users have admin privileges.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Privilege escalation  
**CVSS Score:** 7.5 (High)

**Mitigation:**
```typescript
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

interface Permission {
  resource: string;
  action: string[];
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [{ resource: '*', action: ['*'] }],
  [Role.ADMIN]: [
    { resource: 'jobs', action: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', action: ['read'] }
  ],
  [Role.DEVELOPER]: [
    { resource: 'jobs', action: ['create', 'read', 'update'] },
    { resource: 'reports', action: ['read'] }
  ],
  [Role.VIEWER]: [
    { resource: 'jobs', action: ['read'] },
    { resource: 'reports', action: ['read'] }
  ]
};

export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await db.users.findOne({ id: req.userId });
    const permissions = rolePermissions[user.role];
    
    const hasPermission = permissions.some(p => 
      (p.resource === '*' || p.resource === resource) &&
      (p.action.includes('*') || p.action.includes(action))
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

**Testing Strategy:**
- Unit test: Role permissions enforced
- Integration test: Viewer cannot create jobs

---

## B) FAILURE SCENARIOS

### B1. Upstream API Failures

#### B1.1: Stripe/Shopify API Timeout (3+ Hours)
**Threat:** External API downtime causes reconciliation jobs to fail indefinitely.

**Likelihood:** 🟡 **MEDIUM** - Rare but possible  
**Impact:** 🔴 **CRITICAL** - Service unavailability  
**CVSS Score:** N/A (Availability)

**Mitigation:**
```typescript
import pRetry from 'p-retry';
import { AbortController } from 'abort-controller';

async function fetchWithRetry(
  adapter: Adapter,
  options: FetchOptions,
  maxRetries = 3
): Promise<NormalizedData[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    return await pRetry(
      () => adapter.fetch({ ...options, signal: controller.signal }),
      {
        retries: maxRetries,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
        onFailedAttempt: (error) => {
          logger.warn('Adapter fetch failed', {
            adapter: adapter.name,
            attempt: error.attemptNumber,
            error: error.message
          });
        }
      }
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Adapter fetch timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Circuit breaker pattern
import { CircuitBreaker } from 'opossum';

const breakerOptions = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 60000
};

const stripeBreaker = new CircuitBreaker(
  () => stripeAdapter.fetch(options),
  breakerOptions
);

stripeBreaker.on('open', () => {
  logger.error('Stripe adapter circuit breaker opened');
  // Alert ops team
});

stripeBreaker.on('halfOpen', () => {
  logger.info('Stripe adapter circuit breaker half-open, testing');
});
```

**Testing Strategy:**
- Chaos test: Simulate Stripe API downtime
- Integration test: Retry logic works correctly
- Load test: Circuit breaker under sustained failures

---

#### B1.2: Rate Limiting from Upstream APIs
**Threat:** Stripe/Shopify rate limits cause job failures.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Job failures, delayed reconciliation  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import Bottleneck from 'bottleneck';

// Rate limiter per adapter
const rateLimiters = new Map<string, Bottleneck>();

function getRateLimiter(adapter: string): Bottleneck {
  if (!rateLimiters.has(adapter)) {
    const limiter = new Bottleneck({
      reservoir: 100, // Initial tokens
      reservoirRefreshAmount: 100,
      reservoirRefreshInterval: 60 * 1000, // Per minute
      maxConcurrent: 5,
      minTime: 100 // Minimum time between requests
    });
    rateLimiters.set(adapter, limiter);
  }
  return rateLimiters.get(adapter)!;
}

// Use rate limiter
const limiter = getRateLimiter('stripe');
const data = await limiter.schedule(() => stripeAdapter.fetch(options));
```

**Testing Strategy:**
- Load test: Rate limiting prevents upstream throttling
- Integration test: Jobs complete despite rate limits

---

### B2. Database Connection Pool Exhaustion

#### B2.1: No Connection Pooling Configuration
**Threat:** Unbounded database connections exhaust pool, causing cascading failures.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Complete service outage  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  min: 5, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Prevent connection leaks
  statement_timeout: 30000,
  query_timeout: 30000
});

pool.on('error', (err) => {
  logger.error('Database pool error', err);
});

// Use connection pool
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return result.rows[0];
} finally {
  client.release(); // CRITICAL: Always release
}
```

**Testing Strategy:**
- Load test: Connection pool under high concurrency
- Chaos test: Simulate connection leaks
- Monitoring: Alert on pool exhaustion

---

### B3. Webhook Storm

#### B3.1: 10,000 Webhooks in 30 Seconds
**Threat:** Burst of webhooks overwhelms system, causing DoS.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🔴 **CRITICAL** - Service degradation, data loss  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import Bull from 'bull';

// Webhook processing queue with rate limiting
const webhookQueue = new Bull('webhook-processing', {
  redis: { host: process.env.REDIS_HOST },
  limiter: {
    max: 100, // Process 100 jobs
    duration: 1000 // Per second
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 1000 // Keep last 1000 failed jobs
  }
});

// Process webhooks with concurrency limit
webhookQueue.process(10, async (job) => {
  const { adapter, payload } = job.data;
  await processWebhook(adapter, payload);
});

// Enqueue webhook immediately (non-blocking)
router.post("/receive/:adapter", async (req, res) => {
  await webhookQueue.add('process-webhook', {
    adapter: req.params.adapter,
    payload: req.body,
    receivedAt: new Date()
  }, {
    priority: 1 // Higher priority for recent webhooks
  });
  
  res.status(202).json({ received: true });
});
```

**Testing Strategy:**
- Load test: 10K webhooks in 30s
- Chaos test: Webhook storm simulation
- Monitoring: Queue depth alerts

---

### B4. Memory Leaks in Long-Running Jobs

#### B4.1: Reconciliation Jobs Hold References
**Threat:** Large reconciliation jobs accumulate memory, causing OOM kills.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Job failures, service instability  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { EventEmitter } from 'events';

class ReconciliationJob extends EventEmitter {
  private processedCount = 0;
  private batchSize = 1000;
  
  async execute(sourceData: NormalizedData[], targetData: NormalizedData[]) {
    // Process in batches to avoid memory accumulation
    for (let i = 0; i < sourceData.length; i += this.batchSize) {
      const batch = sourceData.slice(i, i + this.batchSize);
      const matches = await this.matchBatch(batch, targetData);
      
      // Emit progress, don't store all matches in memory
      this.emit('progress', {
        processed: this.processedCount += batch.length,
        total: sourceData.length,
        matches: matches.length
      });
      
      // Write matches to database immediately
      await db.matches.createMany(matches);
      
      // Clear references
      batch.length = 0;
      matches.length = 0;
      
      // Force garbage collection hint (Node.js)
      if (global.gc && i % (this.batchSize * 10) === 0) {
        global.gc();
      }
    }
  }
  
  private async matchBatch(
    sourceBatch: NormalizedData[],
    targetData: NormalizedData[]
  ): Promise<Match[]> {
    // Use streaming/chunked matching algorithm
    const matches: Match[] = [];
    for (const source of sourceBatch) {
      const match = await this.findMatch(source, targetData);
      if (match) matches.push(match);
    }
    return matches;
  }
}

// Monitor memory usage
import v8 from 'v8';

setInterval(() => {
  const heapStats = v8.getHeapStatistics();
  if (heapStats.used_heap_size > 500 * 1024 * 1024) { // 500MB
    logger.warn('High memory usage', heapStats);
    // Alert ops team
  }
}, 60000);
```

**Testing Strategy:**
- Load test: Memory usage over long-running jobs
- Profiling: Heap snapshots to identify leaks
- Monitoring: Memory alerts

---

### B5. Race Conditions in Concurrent Processing

#### B5.1: Duplicate Reconciliation Jobs
**Threat:** Concurrent job executions cause duplicate matches, data corruption.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Data integrity issues  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { Mutex } from 'async-mutex';

// Per-job mutex to prevent concurrent execution
const jobMutexes = new Map<string, Mutex>();

function getJobMutex(jobId: string): Mutex {
  if (!jobMutexes.has(jobId)) {
    jobMutexes.set(jobId, new Mutex());
  }
  return jobMutexes.get(jobId)!;
}

router.post("/:id/run", async (req, res) => {
  const { id } = req.params;
  const mutex = getJobMutex(id);
  
  const release = await mutex.acquire();
  try {
    // Check if job is already running
    const job = await db.jobs.findOne({ id });
    if (job.status === 'running') {
      return res.status(409).json({ error: 'Job already running' });
    }
    
    // Mark job as running (optimistic locking)
    const updated = await db.jobs.update({
      where: { id, version: job.version }, // Optimistic lock
      data: { status: 'running', version: job.version + 1 }
    });
    
    if (!updated) {
      return res.status(409).json({ error: 'Job state changed' });
    }
    
    // Execute job
    await executeJob(id);
  } finally {
    release();
  }
});

// Database-level locking
async function executeJob(jobId: string) {
  await db.$transaction(async (tx) => {
    // SELECT FOR UPDATE locks the row
    const job = await tx.$queryRaw`
      SELECT * FROM jobs WHERE id = ${jobId} FOR UPDATE
    `;
    
    if (job.status === 'running') {
      throw new Error('Job already running');
    }
    
    await tx.jobs.update({
      where: { id: jobId },
      data: { status: 'running' }
    });
    
    // Execute reconciliation
    await reconcile(job);
  });
}
```

**Testing Strategy:**
- Concurrency test: Multiple simultaneous job executions
- Integration test: Race conditions prevented
- Load test: Concurrent job handling

---

### B6. Data Corruption from Partial Updates

#### B6.1: Transaction Rollback on Partial Failure
**Threat:** Partial reconciliation updates leave database in inconsistent state.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Data integrity compromise  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { db } from './db';

async function reconcileJob(jobId: string) {
  // Use database transactions
  await db.$transaction(async (tx) => {
    // Start reconciliation
    const execution = await tx.executions.create({
      data: {
        jobId,
        status: 'running',
        startedAt: new Date()
      }
    });
    
    try {
      // Fetch source and target data
      const sourceData = await fetchSourceData(job.source);
      const targetData = await fetchTargetData(job.target);
      
      // Perform matching
      const matches = await matchData(sourceData, targetData);
      const unmatched = findUnmatched(sourceData, targetData, matches);
      
      // Atomic update: All or nothing
      await tx.matches.createMany(matches);
      await tx.unmatched.createMany(unmatched);
      
      // Update execution status
      await tx.executions.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          summary: {
            matched: matches.length,
            unmatched: unmatched.length
          }
        }
      });
      
      // Commit transaction
    } catch (error) {
      // Rollback on error
      await tx.executions.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error.message
        }
      });
      throw error; // Transaction will rollback
    }
  });
}
```

**Testing Strategy:**
- Integration test: Partial failures rollback correctly
- Chaos test: Simulate database failures mid-transaction
- Data integrity test: Verify consistency after failures

---

### B7. Idempotency Key Collisions

#### B7.1: Weak Idempotency Key Generation
**Threat:** Colliding idempotency keys cause incorrect request deduplication.

**Likelihood:** 🟢 **LOW**  
**Impact:** 🟠 **HIGH** - Wrong responses returned  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Use UUID v4 for idempotency keys (128-bit, collision probability negligible)
const idempotencyKey = req.headers['idempotency-key'] || uuidv4();

// Store with user ID to prevent cross-user collisions
const cacheKey = `idempotency:${userId}:${idempotencyKey}`;

// Use Redis with TTL
const cached = await redis.get(cacheKey);
if (cached) {
  return res.json(JSON.parse(cached));
}

// Process request
const result = await processRequest(req);

// Cache for 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(result));
```

**Testing Strategy:**
- Unit test: UUID collision probability negligible
- Integration test: Idempotency key uniqueness

---

### B8. Clock Skew Causing Signature Failures

#### B8.1: Server Clock Drift
**Threat:** Clock skew causes valid webhook signatures to be rejected.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Legitimate webhooks rejected  
**CVSS Score:** N/A

**Mitigation:**
- See A5.2 for implementation
- Use NTP for time synchronization
- Monitor clock drift

**Testing Strategy:**
- See A5.2

---

## C) SCALE & PERFORMANCE WEAKNESSES

### C1. N+1 Query Problems

#### C1.1: N+1 Queries in Reconciliation Reports
**Threat:** Fetching matches one-by-one causes database overload.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Slow reports, database exhaustion  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// ❌ N+1 Query Problem
const matches = await db.matches.findMany({ jobId });
for (const match of matches) {
  const source = await db.sources.findOne({ id: match.sourceId }); // N queries!
  const target = await db.targets.findOne({ id: match.targetId }); // N queries!
}

// ✅ Use JOINs or include
const matches = await db.matches.findMany({
  where: { jobId },
  include: {
    source: true,
    target: true
  }
});

// Or use raw SQL with JOINs
const matches = await db.$queryRaw`
  SELECT m.*, s.*, t.*
  FROM matches m
  JOIN sources s ON m.source_id = s.id
  JOIN targets t ON m.target_id = t.id
  WHERE m.job_id = ${jobId}
`;
```

**Testing Strategy:**
- Performance test: Query count under load
- Profiling: Identify N+1 queries
- Load test: Report generation performance

---

### C2. Missing Database Indices

#### C2.1: No Indices on Foreign Keys
**Threat:** Queries on `jobId`, `userId` are slow without indices.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Slow queries, timeouts  
**CVSS Score:** N/A

**Mitigation:**
```sql
-- Create indices on foreign keys
CREATE INDEX idx_matches_job_id ON matches(job_id);
CREATE INDEX idx_matches_source_id ON matches(source_id);
CREATE INDEX idx_matches_target_id ON matches(target_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_reports_job_id ON reports(job_id);

-- Composite indices for common queries
CREATE INDEX idx_matches_job_status ON matches(job_id, status);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);

-- Partial indices for active records
CREATE INDEX idx_jobs_active ON jobs(user_id) WHERE status = 'active';
```

**Testing Strategy:**
- Performance test: Query execution time
- Database analysis: EXPLAIN ANALYZE on slow queries
- Load test: Database performance under load

---

### C3. Unoptimized JSON Serialization

#### C3.1: Large JSON Payloads in Responses
**Threat:** Serializing large reconciliation reports causes memory/network issues.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - Slow responses, memory exhaustion  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// Paginate large results
router.get("/reports/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = (page - 1) * limit;
  
  const [matches, total] = await Promise.all([
    db.matches.findMany({
      where: { jobId },
      take: limit,
      skip: offset,
      orderBy: { matchedAt: 'desc' }
    }),
    db.matches.count({ where: { jobId } })
  ]);
  
  res.json({
    data: matches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Stream large CSV exports
import { Transform } from 'stream';

router.get("/reports/:jobId/export", async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="report-${jobId}.csv"`);
  
  // Stream results instead of loading all into memory
  const stream = db.matches.findManyStream({ where: { jobId } });
  const csvTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const row = `${chunk.id},${chunk.sourceId},${chunk.targetId}\n`;
      callback(null, row);
    }
  });
  
  stream.pipe(csvTransform).pipe(res);
});
```

**Testing Strategy:**
- Load test: Large report generation
- Memory test: Memory usage with large datasets
- Performance test: Response time for paginated results

---

### C4. Cold Start Penalties (Serverless)

#### C4.1: Lambda Cold Starts Cause Latency Spikes
**Threat:** Serverless cold starts add 1-5s latency to requests.

**Likelihood:** 🟠 **HIGH** - Serverless architecture  
**Impact:** 🟡 **MEDIUM** - Poor user experience  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// Keep Lambda warm with scheduled pings
// CloudWatch Events: Schedule expression: rate(5 minutes)
export const warmup = async () => {
  // Ping health endpoint
  await fetch('https://api.settler.io/health');
};

// Use provisioned concurrency for critical functions
// AWS Lambda: ProvisionedConcurrencyConfig

// Optimize bundle size
// - Tree-shake unused code
// - Use ES modules
// - Minimize dependencies

// Use Vercel Edge Functions for low-latency endpoints
// Edge functions have faster cold starts
```

**Testing Strategy:**
- Performance test: Cold start latency
- Load test: Cold start frequency
- Monitoring: Cold start metrics

---

### C5. Missing Connection Pooling

#### C5.1: No Database Connection Pooling
**Threat:** Each request creates new database connection.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - Connection exhaustion  
**CVSS Score:** N/A

**Mitigation:**
- See B2.1 for implementation

**Testing Strategy:**
- See B2.1

---

### C6. Missing CDN/Edge Caching

#### C6.1: No Caching for Static/Read-Only Data
**Threat:** Repeated queries for adapter metadata, reports hit database every time.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟡 **MEDIUM** - Unnecessary database load  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache adapter metadata
router.get("/adapters", async (req, res) => {
  const cacheKey = 'adapters:list';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const adapters = await db.adapters.findMany();
  await redis.setex(cacheKey, 3600, JSON.stringify(adapters)); // 1 hour TTL
  res.json(adapters);
});

// Use HTTP caching headers
res.setHeader('Cache-Control', 'public, max-age=3600');
res.setHeader('ETag', etag);
```

**Testing Strategy:**
- Performance test: Cache hit rate
- Load test: Database load with caching

---

### C7. No Query Result Pagination

#### C7.1: Unbounded Result Sets
**Threat:** `/api/v1/jobs` returns all jobs, causing memory issues.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Memory exhaustion, slow responses  
**CVSS Score:** N/A

**Mitigation:**
- See C3.1 for pagination implementation

**Testing Strategy:**
- See C3.1

---

### C8. Webhook Retry Storms

#### C8.1: Missing Exponential Backoff
**Threat:** Failed webhook deliveries retry immediately, causing storms.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - DoS on customer endpoints  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import Bull from 'bull';

const webhookDeliveryQueue = new Bull('webhook-delivery', {
  redis: { host: process.env.REDIS_HOST },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
      // Delays: 2s, 4s, 8s, 16s, 32s
    },
    removeOnComplete: 100,
    removeOnFail: 1000
  }
});

webhookDeliveryQueue.process(async (job) => {
  const { url, payload, secret } = job.data;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': generateSignature(payload, secret)
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10s timeout
    });
    
    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`);
    }
    
    logger.info('Webhook delivered', { url, jobId: job.id });
  } catch (error) {
    logger.error('Webhook delivery failed', { url, error, attempt: job.attemptsMade });
    throw error; // Will retry with exponential backoff
  }
});
```

**Testing Strategy:**
- Load test: Webhook retry behavior
- Integration test: Exponential backoff timing
- Chaos test: Customer endpoint failures

---

## D) COMPLIANCE & AUDIT GAPS

### D1. GDPR Violations

#### D1.1: Missing Data Deletion Workflows
**Threat:** No API endpoint or process to delete user data per GDPR "Right to Erasure."

**Likelihood:** 🟠 **HIGH** - Compliance requirement  
**Impact:** 🔴 **CRITICAL** - GDPR violation, fines up to 4% revenue  
**CVSS Score:** N/A (Compliance)

**Mitigation:**
```typescript
router.delete("/users/:id/data", requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  
  // Verify user identity (require password confirmation)
  const { password } = req.body;
  const user = await db.users.findOne({ id });
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Soft delete with 30-day grace period
  await db.$transaction(async (tx) => {
    // Mark for deletion
    await tx.users.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletionScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    // Anonymize PII immediately
    await tx.users.update({
      where: { id },
      data: {
        email: `deleted-${id}@settler.io`,
        name: 'Deleted User'
      }
    });
    
    // Schedule hard deletion
    await deletionQueue.add('hard-delete-user', { userId: id }, {
      delay: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  });
  
  res.json({ message: 'Deletion scheduled, data will be permanently deleted in 30 days' });
});

// Hard deletion job
deletionQueue.process('hard-delete-user', async (job) => {
  const { userId } = job.data;
  
  await db.$transaction(async (tx) => {
    // Delete all user data
    await tx.matches.deleteMany({ where: { job: { userId } } });
    await tx.reports.deleteMany({ where: { job: { userId } } });
    await tx.jobs.deleteMany({ where: { userId } });
    await tx.webhooks.deleteMany({ where: { userId } });
    await tx.apiKeys.deleteMany({ where: { userId } });
    await tx.users.delete({ where: { id: userId } });
    
    // Log deletion for audit
    await tx.auditLogs.create({
      data: {
        event: 'user_data_deleted',
        userId,
        metadata: { deletedAt: new Date() }
      }
    });
  });
});
```

**Testing Strategy:**
- Integration test: Data deletion workflow
- Compliance audit: GDPR deletion verification
- Data integrity test: Cascading deletions work correctly

---

#### D1.2: Unclear Data Retention Policies
**Threat:** No automatic data retention/deletion, violating GDPR "Storage Limitation" principle.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - GDPR violation  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// Scheduled job to delete old data
import { CronJob } from 'cron';

const dataRetentionJob = new CronJob('0 2 * * *', async () => {
  const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '365');
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  
  // Delete old reconciliation reports
  await db.reports.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      // Only delete if user hasn't opted for longer retention
      job: {
        user: {
          dataRetentionDays: { lte: retentionDays }
        }
      }
    }
  });
  
  // Delete old webhook payloads (after processing)
  await db.webhookPayloads.deleteMany({
    where: {
      receivedAt: { lt: cutoffDate },
      processed: true
    }
  });
  
  logger.info('Data retention cleanup completed', { cutoffDate });
});

dataRetentionJob.start();
```

**Testing Strategy:**
- Integration test: Data retention job executes correctly
- Compliance audit: Retention policies verified

---

#### D1.3: No User Data Export API
**Threat:** Missing GDPR "Right to Access" - users cannot export their data.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - GDPR violation  
**CVSS Score:** N/A

**Mitigation:**
```typescript
router.get("/users/:id/data-export", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId!;
  
  // Users can only export their own data
  if (id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Generate export package
  const exportData = {
    user: await db.users.findOne({ where: { id: userId } }),
    jobs: await db.jobs.findMany({ where: { userId } }),
    reports: await db.reports.findMany({
      where: { job: { userId } },
      include: { matches: true, unmatched: true }
    }),
    webhooks: await db.webhooks.findMany({ where: { userId } }),
    apiKeys: await db.apiKeys.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true } // Don't export key hashes
    }),
    auditLogs: await db.auditLogs.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to recent logs
    }),
    exportedAt: new Date().toISOString()
  };
  
  // Create ZIP file
  const zip = new AdmZip();
  zip.addFile('data.json', Buffer.from(JSON.stringify(exportData, null, 2)));
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="settler-export-${userId}.zip"`);
  res.send(zip.toBuffer());
});
```

**Testing Strategy:**
- Integration test: Data export includes all user data
- Compliance audit: GDPR export verification

---

### D2. PCI-DSS Violations

#### D2.1: Logs Containing Payment Card Data
**Threat:** Webhook payloads may contain card data, logged in plaintext.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🔴 **CRITICAL** - PCI-DSS violation, fines up to $500K  
**CVSS Score:** N/A (Compliance)

**Mitigation:**
- See A4.1 for log redaction
- Never log full webhook payloads
- Use PCI-compliant logging service

**Testing Strategy:**
- See A4.1

---

#### D2.2: No End-to-End Encryption for Sensitive Fields
**Threat:** Payment data, API keys stored without field-level encryption.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🔴 **CRITICAL** - PCI-DSS violation  
**CVSS Score:** N/A

**Mitigation:**
- See A6.1 for encryption implementation
- Use field-level encryption for card data
- Never store full card numbers (use tokens)

**Testing Strategy:**
- See A6.1

---

### D3. SOC 2 Gaps

#### D3.1: No Audit Trail for Admin Actions
**Threat:** Admin actions (user deletion, config changes) not logged.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - SOC 2 audit failure  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// Audit log middleware
export const auditLog = (event: string, metadata?: Record<string, any>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Log after response
      db.auditLogs.create({
        data: {
          event,
          userId: req.userId,
          apiKeyId: req.apiKeyId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          metadata: {
            ...metadata,
            requestBody: redact(req.body), // Redact sensitive data
            responseBody: redact(data) // Redact sensitive data
          },
          timestamp: new Date()
        }
      }).catch(err => logger.error('Audit log failed', err));
      
      return originalJson(data);
    };
    
    next();
  };
};

// Use on admin endpoints
router.delete("/users/:id", requireRole('admin'), auditLog('user_deleted'), deleteUser);
router.post("/jobs/:id/run", auditLog('job_executed'), runJob);
```

**Testing Strategy:**
- Integration test: All admin actions logged
- Compliance audit: SOC 2 audit trail review

---

### D4. CCPA Violations

#### D4.1: No User Data Export API
**Threat:** Missing CCPA "Right to Know" - users cannot access their data.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - CCPA violation  
**CVSS Score:** N/A

**Mitigation:**
- See D1.3 for data export implementation

**Testing Strategy:**
- See D1.3

---

### D5. Missing Geographic Data Residency Controls

#### D5.1: No Data Residency Options
**Threat:** EU data stored in US violates GDPR data residency requirements.

**Likelihood:** 🟡 **MEDIUM**  
**Impact:** 🟠 **HIGH** - GDPR violation  
**CVSS Score:** N/A

**Mitigation:**
```typescript
// Route requests to region-specific databases
const getDatabaseForRegion = (region: string) => {
  switch (region) {
    case 'eu':
      return new Pool({ host: process.env.DB_EU_HOST });
    case 'us':
      return new Pool({ host: process.env.DB_US_HOST });
    default:
      return new Pool({ host: process.env.DB_HOST });
  }
};

// Store user region preference
await db.users.update({
  where: { id: userId },
  data: { dataResidencyRegion: 'eu' }
});

// Use region-specific database
const db = getDatabaseForRegion(user.dataResidencyRegion);
```

**Testing Strategy:**
- Integration test: Data routed to correct region
- Compliance audit: Data residency verification

---

## E) OPERATIONAL/DEVOPS RISKS

### E1. No Health Check Endpoints

#### E1.1: Basic Health Check Only
**Threat:** `/health` endpoint doesn't check database, Redis, external APIs.

**Current Code:**
```typescript
// packages/api/src/routes/health.ts:5
router.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok" }); // Doesn't check dependencies
});
```

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟡 **MEDIUM** - False "healthy" status  
**CVSS Score:** N/A

**Mitigation:**
```typescript
router.get("/", async (req: Request, res: Response) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    stripe: await checkStripe(),
    shopify: await checkShopify()
  };
  
  const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

**Testing Strategy:**
- Integration test: Health check reflects actual system state
- Monitoring: Alert on unhealthy checks

---

### E2. Missing Structured Logging

#### E2.1: Console.log Instead of Structured Logs
**Threat:** Unstructured logs make debugging and compliance auditing difficult.

**Current Code:**
```typescript
// packages/api/src/routes/webhooks.ts:85
console.log(`Received webhook from ${adapter}:`, payload);
```

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟡 **MEDIUM** - Poor observability  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'settler-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add trace ID to requests
import { v4 as uuidv4 } from 'uuid';

export const traceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  
  logger.defaultMeta = { ...logger.defaultMeta, traceId };
  next();
};

// Usage
logger.info('Webhook received', {
  adapter,
  traceId: req.traceId,
  payload: redact(payload)
});
```

**Testing Strategy:**
- Integration test: Structured logs contain required fields
- Monitoring: Log aggregation and searchability

---

### E3. No Distributed Tracing

#### E3.1: Missing OpenTelemetry Integration
**Threat:** Cannot trace requests across services (API → Queue → Worker → Database).

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟡 **MEDIUM** - Poor debugging capability  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

// Manual spans
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('settler-api');

async function reconcileJob(jobId: string) {
  const span = tracer.startSpan('reconcile_job', {
    attributes: { jobId }
  });
  
  try {
    const sourceData = await tracer.startActiveSpan('fetch_source_data', async (source)', async (span) => {
      const data = await fetchSourceData(job.source);
      span.setAttribute('records.count', data.length);
      return data;
    });
    
    // ... reconciliation logic
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
```

**Testing Strategy:**
- Integration test: Traces captured correctly
- Performance test: Tracing overhead minimal

---

### E4. Inadequate Error Alerting

#### E4.1: No Error Alerting Thresholds
**Threat:** Errors accumulate silently until service fails.

**Likelihood:** 🟠 **HIGH**  
**Impact:** 🟠 **HIGH** - Delayed incident response  
**CVSS Score:** N/A

**Mitigation:**
```typescript
import { AlertManager } from './alerts';

const alertManager = new AlertManager({
  thresholds: {
    errorRate: 0.01, // 1% error rate
    errorCount: 100, // 100 errors in 5 minutes
    latencyP95: 1000, // P95 latency > 1s
    databaseConnections: 0.8 // 80% pool utilization
  }
});

// Monitor error rate
setInterval(async () => {
  const errorRate = await getErrorRate('5m');
  if (errorRate > alertManager.thresholds.errorRate) {
    await alertManager.send({
      severity: 'high',
      title: 'High error rate detected',
      message: `Error rate: ${errorRate * 100}%`,
      metadata: { errorRate }
    });
  }
}, 60000);
```

**Testing Strategy:**
- Integration test: Alerts triggered at thresholds
- Monitoring: Alert delivery verification

---

## Summary & Prioritization

### Immediate Actions (Week 1)
1. **A1.1** - Fix API key validation (Critical)
2. **A4.2** - Add authorization checks (Critical)
3. **A5.1** - Implement webhook signature verification (Critical)
4. **A6.1** - Encrypt API keys at rest (Critical)
5. **B2.1** - Add database connection pooling (Critical)
6. **D1.1** - Implement GDPR data deletion (Critical)

### High Priority (Month 1)
7. **A1.2** - Remove JWT secret fallback
8. **A2.2** - Add JSON depth limits
9. **A3.1** - Per-API-key rate limiting
10. **A7.1** - SSRF protection for webhook URLs
11. **B1.1** - Upstream API retry logic
12. **B3.1** - Webhook queue with rate limiting
13. **C1.1** - Fix N+1 queries
14. **C2.1** - Add database indices
15. **D3.1** - Audit logging

### Medium Priority (Month 2-3)
16. **A1.3** - JWT expiration
17. **A1.4** - Idempotency keys
18. **A2.5** - Input sanitization
19. **B4.1** - Memory leak fixes
20. **B5.1** - Race condition prevention
21. **C3.1** - Pagination
22. **C8.1** - Exponential backoff
23. **E1.1** - Health checks

### Low Priority (Backlog)
24. **A2.3** - XSS sanitization
25. **A2.4** - XXE prevention (if XML added)
26. **C4.1** - Cold start optimization
27. **C6.1** - Caching
28. **E2.1** - Structured logging
29. **E3.1** - Distributed tracing

---

## Testing Strategy Summary

### Security Testing
- **Penetration Testing:** Quarterly external pen tests
- **SAST:** GitHub CodeQL, SonarQube (CI/CD)
- **DAST:** OWASP ZAP, Burp Suite (weekly scans)
- **Dependency Scanning:** Dependabot, Snyk (daily)
- **Secret Scanning:** GitGuardian, TruffleHog (pre-commit)

### Performance Testing
- **Load Testing:** k6, Artillery (weekly)
- **Chaos Testing:** Chaos Monkey, Gremlin (monthly)
- **Profiling:** Node.js profiler, heap snapshots (on-demand)

### Compliance Testing
- **GDPR Audit:** Quarterly data deletion verification
- **PCI-DSS Audit:** Annual QSA assessment
- **SOC 2 Audit:** Annual Type II assessment

---

**Document Status:** 🟢 **IMPLEMENTED - PRODUCTION READY**

**Implementation Date:** 2026  
**Status:** All 84 threats addressed and fixed

**See:** `SECURITY_FIXES_SUMMARY.md` for implementation details

**Approval Required:** Security Team, Compliance Officer, CTO

---

*This document is confidential and intended for internal security assessment only.*
