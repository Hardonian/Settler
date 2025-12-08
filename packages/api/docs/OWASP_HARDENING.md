# OWASP Top 10 Hardening Guide

This document outlines how Settler mitigates each OWASP Top 10 risk with code examples, vulnerable patterns, and secure implementations.

## A01:2021 – Broken Access Control

### Risk
Attackers can access resources they shouldn't have permission to access.

### Vulnerable Pattern
```typescript
// BAD: No access control check
app.get('/api/jobs/:id', async (req, res) => {
  const job = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
  res.json(job);
});
```

### Secure Implementation
```typescript
// GOOD: Always verify tenant context and permissions
app.get('/api/jobs/:id', 
  authMiddleware,
  tenantMiddleware,
  requirePermission(Permission.JOBS_READ),
  async (req: AuthorizedRequest, res) => {
    // RLS automatically filters by tenant_id
    const job = await db.query(
      'SELECT * FROM jobs WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    
    if (job.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job[0]);
  }
);
```

### Test Strategy
```typescript
describe('Access Control', () => {
  it('should prevent cross-tenant access', async () => {
    const tenant1Job = await createJob(tenant1Id);
    const tenant2Token = await getToken(tenant2User);
    
    const response = await request(app)
      .get(`/api/jobs/${tenant1Job.id}`)
      .set('Authorization', `Bearer ${tenant2Token}`);
    
    expect(response.status).toBe(404); // Not found, not 403
  });
});
```

---

## A02:2021 – Cryptographic Failures

### Risk
Sensitive data exposed due to weak encryption or missing encryption.

### Vulnerable Pattern
```typescript
// BAD: Plain text storage, weak algorithm
const encrypted = crypto.createCipher('aes-128', key).update(data);
```

### Secure Implementation
```typescript
// GOOD: Strong encryption, proper key management
import { encrypt, decrypt } from '../infrastructure/security/encryption';

// AES-256-GCM with authenticated encryption
export function encryptSensitive(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
}

// API keys stored hashed (bcrypt)
const apiKeyHash = await hashApiKey(apiKey);
await db.query('INSERT INTO api_keys (key_hash) VALUES ($1)', [apiKeyHash]);
```

### Test Strategy
```typescript
describe('Cryptographic Security', () => {
  it('should hash API keys with bcrypt', async () => {
    const { key } = generateApiKey();
    const hash = await hashApiKey(key);
    
    expect(hash).not.toContain(key);
    expect(hash.startsWith('$2b$')).toBe(true); // bcrypt format
  });
  
  it('should use AES-256-GCM for encryption', () => {
    const encrypted = encryptSensitive('sensitive-data', encryptionKey);
    const parsed = JSON.parse(encrypted);
    
    expect(parsed.iv).toBeDefined();
    expect(parsed.authTag).toBeDefined(); // GCM authentication tag
  });
});
```

---

## A03:2021 – Injection

### Risk
SQL injection, NoSQL injection, command injection attacks.

### Vulnerable Pattern
```typescript
// BAD: SQL injection vulnerability
app.get('/api/users', async (req, res) => {
  const query = `SELECT * FROM users WHERE email = '${req.query.email}'`;
  const users = await db.query(query);
  res.json(users);
});
```

### Secure Implementation
```typescript
// GOOD: Parameterized queries + input validation
import { validateQuery } from '../infrastructure/security/InputValidation';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email().max(255),
});

app.get('/api/users',
  validateQuery(emailSchema),
  async (req, res) => {
    // Parameterized query prevents SQL injection
    const users = await db.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [req.query.email, req.tenantId]
    );
    res.json(users);
  }
);
```

### Test Strategy
```typescript
describe('Injection Prevention', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .get('/api/users')
      .query({ email: maliciousInput });
    
    // Should be rejected by validation, not executed
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ValidationError');
  });
});
```

---

## A04:2021 – Insecure Design

### Risk
Security flaws in design and architecture.

### Vulnerable Pattern
```typescript
// BAD: No rate limiting, no quota enforcement
app.post('/api/reconciliations', async (req, res) => {
  await processReconciliation(req.body);
  res.json({ success: true });
});
```

### Secure Implementation
```typescript
// GOOD: Defense in depth with multiple layers
app.post('/api/reconciliations',
  authMiddleware,
  tenantMiddleware,
  rateLimitMiddleware(), // Rate limiting
  quotaMiddleware(QuotaType.MONTHLY_RECONCILIATIONS, 1), // Quota check
  validateBody(reconciliationSchema), // Input validation
  requirePermission(Permission.JOBS_WRITE), // Authorization
  async (req, res) => {
    await processReconciliation(req.body);
    res.json({ success: true });
  }
);
```

### Test Strategy
```typescript
describe('Defense in Depth', () => {
  it('should enforce rate limits', async () => {
    const token = await getToken(user);
    
    // Send requests exceeding rate limit
    const promises = Array(1000).fill(null).map(() =>
      request(app)
        .post('/api/reconciliations')
        .set('Authorization', `Bearer ${token}`)
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## A05:2021 – Security Misconfiguration

### Risk
Default configurations, incomplete configurations, exposed debug info.

### Vulnerable Pattern
```typescript
// BAD: Default secrets, debug mode in production
const config = {
  jwtSecret: 'your-secret-key-change-in-production',
  debug: true,
  cors: { origin: '*' },
};
```

### Secure Implementation
```typescript
// GOOD: Validation at startup, secure defaults
import { SecretsManager, REQUIRED_SECRETS } from '../infrastructure/security/SecretsManager';

// Validate all secrets at startup
if (config.nodeEnv === 'production') {
  SecretsManager.validateSecrets(REQUIRED_SECRETS);
  
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  if (config.allowedOrigins.includes('*')) {
    throw new Error('CORS wildcard not allowed in production');
  }
}

// Secure defaults
const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET, // Validated
    accessTokenExpiry: '15m', // Short-lived tokens
    refreshTokenExpiry: '7d',
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  },
};
```

### Test Strategy
```typescript
describe('Security Configuration', () => {
  it('should reject weak secrets', () => {
    process.env.JWT_SECRET = 'weak';
    
    expect(() => {
      SecretsManager.validateSecrets(REQUIRED_SECRETS);
    }).toThrow('Invalid secrets');
  });
  
  it('should reject CORS wildcard in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = '*';
    
    expect(() => {
      loadConfig();
    }).toThrow('CORS wildcard not allowed');
  });
});
```

---

## A06:2021 – Vulnerable and Outdated Components

### Risk
Using components with known vulnerabilities.

### Vulnerable Pattern
```json
// BAD: Outdated dependencies with known CVEs
{
  "dependencies": {
    "express": "^4.0.0", // Old version with vulnerabilities
    "lodash": "3.0.0"
  }
}
```

### Secure Implementation
```json
// GOOD: Regular updates, dependency scanning
{
  "dependencies": {
    "express": "^4.18.2", // Latest patched version
    "lodash": "^4.17.21"
  }
}
```

```bash
# Automated dependency scanning
npm audit
npm audit fix

# Use Dependabot or Snyk for automated updates
```

### Test Strategy
```bash
# CI/CD pipeline
- name: Security audit
  run: npm audit --audit-level=moderate
  
- name: Dependency check
  run: npx snyk test
```

---

## A07:2021 – Identification and Authentication Failures

### Risk
Weak authentication, session management flaws.

### Vulnerable Pattern
```typescript
// BAD: Long-lived tokens, no refresh mechanism
const token = jwt.sign({ userId }, secret, { expiresIn: '30d' });
```

### Secure Implementation
```typescript
// GOOD: Short-lived access tokens + refresh tokens
import { ZeroTrustAuth } from '../infrastructure/security/ZeroTrustAuth';

// Access token: 15 minutes
const accessToken = ZeroTrustAuth.generateAccessToken(user, scopes);

// Refresh token: 7 days
const refreshToken = ZeroTrustAuth.generateRefreshToken(user);

// Verify with revocation check
const payload = ZeroTrustAuth.verifyAccessToken(token);
const isRevoked = await ZeroTrustAuth.isTokenRevoked(payload.jti);

if (isRevoked) {
  throw new Error('Token revoked');
}
```

### Test Strategy
```typescript
describe('Authentication Security', () => {
  it('should expire access tokens after 15 minutes', async () => {
    const token = ZeroTrustAuth.generateAccessToken(user, []);
    
    // Fast-forward time
    jest.useFakeTimers();
    jest.advanceTimersByTime(16 * 60 * 1000);
    
    expect(() => {
      ZeroTrustAuth.verifyAccessToken(token);
    }).toThrow('Access token expired');
  });
  
  it('should prevent refresh token reuse', async () => {
    const refreshToken = ZeroTrustAuth.generateRefreshToken(user);
    
    // Use token once
    await refreshAccessToken(refreshToken);
    
    // Try to reuse
    await expect(
      refreshAccessToken(refreshToken)
    ).rejects.toThrow('Token already used');
  });
});
```

---

## A08:2021 – Software and Data Integrity Failures

### Risk
CI/CD pipeline vulnerabilities, insecure deserialization.

### Vulnerable Pattern
```typescript
// BAD: Unsafe deserialization
const data = eval(req.body.code); // Dangerous!
const config = JSON.parse(untrustedInput); // No validation
```

### Secure Implementation
```typescript
// GOOD: Safe deserialization with validation
import { validateJson, sanitizeString } from '../infrastructure/security/InputValidation';
import { z } from 'zod';

const configSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.string().max(10000),
});

// Validate before parsing
const sanitized = sanitizeString(req.body.config);
const parsed = validateJson(sanitized);
const validated = configSchema.parse(parsed);

// Use validated data
await updateConfig(validated);
```

### Test Strategy
```typescript
describe('Data Integrity', () => {
  it('should reject malicious JSON payloads', async () => {
    const malicious = JSON.stringify({
      __proto__: { isAdmin: true },
    });
    
    expect(() => {
      validateJson(malicious);
    }).toThrow();
  });
  
  it('should sanitize XSS attempts', () => {
    const xss = '<script>alert("xss")</script>';
    const sanitized = sanitizeString(xss);
    
    expect(sanitized).not.toContain('<script>');
  });
});
```

---

## A09:2021 – Security Logging and Monitoring Failures

### Risk
Insufficient logging, missing security event monitoring.

### Vulnerable Pattern
```typescript
// BAD: No logging of security events
app.post('/api/login', async (req, res) => {
  const user = await authenticate(req.body);
  res.json({ token: generateToken(user) });
});
```

### Secure Implementation
```typescript
// GOOD: Comprehensive security logging
import { query } from '../db';
import { logInfo, logWarn, logError } from '../utils/logger';

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await authenticate(email, password);
    
    // Log successful authentication
    await query(
      `INSERT INTO audit_logs (event, user_id, ip, user_agent, status_code, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'login_success',
        user.id,
        req.ip,
        req.headers['user-agent'],
        200,
        JSON.stringify({ email }),
      ]
    );
    
    logInfo('User logged in', { userId: user.id, ip: req.ip });
    
    res.json({ token: generateToken(user) });
  } catch (error) {
    // Log failed authentication
    await query(
      `INSERT INTO audit_logs (event, ip, user_agent, status_code, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'login_failed',
        req.ip,
        req.headers['user-agent'],
        401,
        JSON.stringify({ email, error: error.message }),
      ]
    );
    
    logWarn('Failed login attempt', { email, ip: req.ip });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

### Test Strategy
```typescript
describe('Security Logging', () => {
  it('should log failed authentication attempts', async () => {
    await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    
    const logs = await query(
      'SELECT * FROM audit_logs WHERE event = $1 ORDER BY timestamp DESC LIMIT 1',
      ['login_failed']
    );
    
    expect(logs[0]).toBeDefined();
    expect(logs[0].ip).toBeDefined();
  });
});
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Risk
Forcing server to make requests to unintended locations.

### Vulnerable Pattern
```typescript
// BAD: No validation of URLs
app.post('/api/webhook', async (req, res) => {
  const url = req.body.url;
  await fetch(url); // Dangerous!
  res.json({ success: true });
});
```

### Secure Implementation
```typescript
// GOOD: URL validation and allowlist
import { validateUrl, isAllowedUrl } from '../infrastructure/security/SSRFProtection';

app.post('/api/webhook',
  validateBody(z.object({ url: z.string().url() })),
  async (req, res) => {
    const url = req.body.url;
    
    // Validate URL is not internal
    if (!isAllowedUrl(url)) {
      return res.status(400).json({
        error: 'InvalidURL',
        message: 'URL must be external and use HTTPS',
      });
    }
    
    // Validate not pointing to internal IPs
    const parsedUrl = new URL(url);
    if (isInternalIP(parsedUrl.hostname)) {
      return res.status(400).json({
        error: 'InvalidURL',
        message: 'Internal URLs not allowed',
      });
    }
    
    await fetch(url);
    res.json({ success: true });
  }
);
```

### Test Strategy
```typescript
describe('SSRF Prevention', () => {
  it('should reject internal URLs', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ url: 'http://localhost:5432' });
    
    expect(response.status).toBe(400);
  });
  
  it('should reject private IP addresses', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send({ url: 'http://192.168.1.1' });
    
    expect(response.status).toBe(400);
  });
});
```

---

## Summary

Settler implements defense in depth with:

1. **Access Control**: RLS + permission checks
2. **Cryptography**: Strong encryption, hashed secrets
3. **Injection Prevention**: Parameterized queries + validation
4. **Secure Design**: Multiple security layers
5. **Configuration**: Validated secrets, secure defaults
6. **Dependencies**: Regular updates, vulnerability scanning
7. **Authentication**: Short-lived tokens, refresh mechanism
8. **Data Integrity**: Safe deserialization, input sanitization
9. **Logging**: Comprehensive audit logs
10. **SSRF Prevention**: URL validation, IP filtering
