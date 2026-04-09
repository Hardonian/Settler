# Zero Trust Networking Architecture

## Overview

Settler implements Zero Trust networking principles: **Never trust, always verify**.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ TLS 1.3
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    API Gateway (Public)                          │
│  - TLS termination                                               │
│  - Rate limiting                                                 │
│  - DDoS protection                                               │
│  - WAF rules                                                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ mTLS / Signed JWT
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  API Server  │ │  Job Worker │ │ Webhook      │
│  (Zone 1)   │ │  (Zone 1)   │ │  Service     │
│              │ │              │ │  (Zone 1)    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       │                │                │
       └────────────────┼────────────────┘
                        │
                        │ mTLS / Service Tokens
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Database    │ │    Redis     │ │   Queue      │
│  (Zone 2)    │ │   (Zone 2)   │ │   (Zone 2)   │
│  Private     │ │   Private    │ │   Private    │
│  Subnet      │ │   Subnet     │ │   Subnet     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Security Zones

### Zone 1: Application Services (DMZ)

**Services:**

- API Server
- Job Workers
- Webhook Service

**Trust Level**: Low
**Access:**

- Inbound: Internet → API Gateway (TLS 1.3)
- Outbound: mTLS to Zone 2 services
- Inter-service: Signed JWT service tokens

**Security Controls:**

- Network segmentation
- Service-to-service authentication
- Least privilege access
- Audit logging

### Zone 2: Data Services (Private)

**Services:**

- PostgreSQL Database
- Redis Cache
- Message Queue

**Trust Level**: None (assume breach)
**Access:**

- Inbound: Only from Zone 1 (mTLS)
- Outbound: None (no internet access)
- Inter-service: mTLS only

**Security Controls:**

- Private subnet (no public IPs)
- Network ACLs
- Encryption at rest
- Access logging

## Service-to-Service Authentication

### Option 1: mTLS (Mutual TLS)

**Implementation:**

```typescript
// Service certificate configuration
const tlsConfig = {
  cert: fs.readFileSync("/etc/certs/service.crt"),
  key: fs.readFileSync("/etc/certs/service.key"),
  ca: fs.readFileSync("/etc/certs/ca.crt"),
  rejectUnauthorized: true,
};

// Database connection with mTLS
const pool = new Pool({
  ...dbConfig,
  ssl: tlsConfig,
});
```

**Benefits:**

- Strong authentication
- Encryption in transit
- Certificate-based identity

**Challenges:**

- Certificate management
- Rotation complexity

### Option 2: Signed JWT Service Tokens

**Implementation:**

```typescript
// Generate service token
const serviceToken = jwt.sign(
  {
    service: "api-server",
    scope: ["db:read", "db:write"],
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  },
  SERVICE_SECRET,
  { algorithm: "HS256" }
);

// Verify service token
const decoded = jwt.verify(serviceToken, SERVICE_SECRET);
if (decoded.service !== "api-server") {
  throw new Error("Invalid service");
}
```

**Benefits:**

- Simpler than mTLS
- Easy rotation
- Scope-based permissions

**Challenges:**

- Secret management
- Token expiration handling

## Network Segmentation

### Public Subnet

- **Components**: API Gateway, Load Balancer
- **Access**: Internet-facing
- **Security**: WAF, DDoS protection, rate limiting

### Private Subnet (Zone 1)

- **Components**: API Server, Workers
- **Access**: Only from public subnet
- **Security**: Network ACLs, no public IPs

### Private Subnet (Zone 2)

- **Components**: Database, Cache, Queue
- **Access**: Only from Zone 1
- **Security**: Strict ACLs, encryption at rest

## Policy Samples

### Database Access Policy

**Who Can Access:**

- API Server (read/write)
- Job Workers (read/write)
- Admin tools (read-only, from bastion)

**How:**

- mTLS with service certificates
- IP whitelist (Zone 1 only)
- RLS policies for tenant isolation

**Example:**

```sql
-- Network ACL (PostgreSQL pg_hba.conf)
hostssl    settler    api-server    10.0.1.0/24    cert
hostssl    settler    job-worker    10.0.1.0/24    cert
hostssl    settler    all           0.0.0.0/0      reject
```

### Cache Access Policy

**Who Can Access:**

- API Server (read/write)
- Job Workers (read/write)

**How:**

- Redis AUTH password
- IP whitelist
- TLS encryption

**Example:**

```bash
# Redis configuration
requirepass ${REDIS_PASSWORD}
bind 10.0.2.10  # Private IP only
tls-port 6380
tls-cert-file /etc/certs/redis.crt
tls-key-file /etc/certs/redis.key
tls-ca-cert-file /etc/certs/ca.crt
```

### Queue Access Policy

**Who Can Access:**

- API Server (publish)
- Job Workers (consume)

**How:**

- Service tokens
- Queue-level permissions
- IP whitelist

## Trust Boundaries

### External → API Gateway

- **Trust**: None
- **Verification**: TLS certificate validation
- **Authentication**: API keys or JWT tokens

### API Gateway → Application Services

- **Trust**: None
- **Verification**: Service identity (mTLS or JWT)
- **Authentication**: Service certificates or tokens

### Application Services → Data Services

- **Trust**: None
- **Verification**: Service identity + IP whitelist
- **Authentication**: mTLS or service tokens

## Implementation Status

### Current Implementation

- ✅ TLS 1.3 for external traffic
- ✅ Network segmentation (VPC)
- ✅ Private subnets for data services
- ✅ Service-to-service authentication (JWT)
- ✅ IP whitelisting

### Planned Implementation

- ⏳ mTLS for all service-to-service communication
- ⏳ Certificate management automation
- ⏳ Service mesh (Istio/Linkerd) for advanced policies
- ⏳ Network policy enforcement (Kubernetes NetworkPolicies)

## Monitoring and Enforcement

### Network Monitoring

- Flow logs (VPC Flow Logs)
- Connection tracking
- Anomaly detection

### Policy Enforcement

- Network ACLs
- Security groups
- Firewall rules
- Service mesh policies

### Audit Logging

- All service-to-service connections logged
- Certificate validation failures logged
- Policy violations logged

## Compliance Considerations

### SOC 2

- **CC6.6**: Encryption in transit (mTLS)
- **CC6.7**: Network segmentation
- **CC7.2**: Access logging

### GDPR

- **Article 32**: Security of processing (encryption, access controls)

### PCI-DSS

- **Requirement 1**: Firewall configuration
- **Requirement 4**: Encryption in transit

## Best Practices

1. **Never Trust**: Verify every connection
2. **Least Privilege**: Minimum required access
3. **Assume Breach**: Design for compromise
4. **Encrypt Everything**: TLS/mTLS for all connections
5. **Log Everything**: Audit all access
6. **Segment Networks**: Isolate by trust level
7. **Rotate Credentials**: Regular rotation of certificates/tokens
8. **Monitor Continuously**: Real-time anomaly detection

## References

- NIST Zero Trust Architecture: https://www.nist.gov/publications/zero-trust-architecture
- OWASP API Security: https://owasp.org/www-project-api-security/
- Cloud Security Alliance Zero Trust: https://cloudsecurityalliance.org/research/working-groups/zero-trust/
