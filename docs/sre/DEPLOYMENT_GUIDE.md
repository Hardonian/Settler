# Settler Deployment Guide

**Version:** 1.0  
**Last Updated:** 2026-01-15

---

## Overview

This guide covers deployment procedures for Settler across different environments and platforms.

---

## Prerequisites

### Required Tools

- Docker & Docker Compose (for local development)
- Kubernetes CLI (kubectl) (for Kubernetes deployments)
- Terraform (for infrastructure as code)
- CI/CD access (GitHub Actions, GitLab CI, etc.)

### Required Access

- Cloud provider account (AWS, GCP, Azure)
- Database access (PostgreSQL)
- Redis access
- Container registry access
- DNS management access

---

## Environment Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Node Environment
NODE_ENV=production
DEPLOYMENT_ENV=production

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# JWT
JWT_SECRET=your-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=your-encryption-key-32-chars-long!!

# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

### Secrets Management

**Production Secrets:**
- Store in AWS Secrets Manager, HashiCorp Vault, or similar
- Never commit secrets to git
- Rotate secrets regularly
- Use different secrets per environment

---

## Deployment Options

### Option 1: Vercel (Recommended for MVP)

**Pros:**
- Zero-config deployment
- Automatic scaling
- Edge network
- Built-in CI/CD

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy API:**
```bash
cd packages/api
vercel --prod
```

4. **Deploy Web:**
```bash
cd packages/web
vercel --prod
```

5. **Configure Environment Variables:**
- Go to Vercel dashboard
- Project → Settings → Environment Variables
- Add all required variables

**Configuration:**
- `vercel.json` in `packages/api`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

---

### Option 2: AWS (Production)

**Architecture:**
- API: AWS Lambda + API Gateway
- Database: RDS PostgreSQL
- Cache: ElastiCache Redis
- Storage: S3
- CDN: CloudFront

**Steps:**

1. **Build Docker Image:**
```bash
docker build -t settler-api:latest packages/api
```

2. **Push to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag settler-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/settler-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/settler-api:latest
```

3. **Deploy with Terraform:**
```bash
cd infrastructure/aws
terraform init
terraform plan
terraform apply
```

**Terraform Configuration:**
```hcl
# infrastructure/aws/main.tf
module "settler_api" {
  source = "./modules/api"
  
  environment = "production"
  vpc_id      = var.vpc_id
  subnet_ids  = var.subnet_ids
  
  database_url = var.database_url
  redis_url    = var.redis_url
}
```

---

### Option 3: Kubernetes (Enterprise)

**Prerequisites:**
- Kubernetes cluster (EKS, GKE, AKS)
- Helm installed

**Steps:**

1. **Build and Push Image:**
```bash
docker build -t settler-api:latest packages/api
docker tag settler-api:latest registry.example.com/settler-api:v1.0.0
docker push registry.example.com/settler-api:v1.0.0
```

2. **Deploy with Helm:**
```bash
helm install settler-api ./helm/settler-api \
  --set image.tag=v1.0.0 \
  --set environment=production \
  --set database.url=$DATABASE_URL \
  --set redis.url=$REDIS_URL
```

**Helm Chart Structure:**
```
helm/settler-api/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
```

---

### Option 4: Docker Compose (Local/Development)

**Steps:**

1. **Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: ./packages/api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/settler
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=settler
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

2. **Start Services:**
```bash
docker-compose up -d
```

3. **Run Migrations:**
```bash
docker-compose exec api npm run migrate
```

---

## CI/CD Pipeline

### GitHub Actions

**Workflow:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to production
        run: |
          # Deployment steps
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Database Migrations

### Running Migrations

**Local:**
```bash
npm run migrate
```

**Production:**
```bash
# Via API container
kubectl exec -it deployment/api -- npm run migrate

# Or via database connection
psql $DATABASE_URL -f packages/api/src/db/migrations/001-initial-schema.sql
```

### Migration Best Practices

- [ ] Test migrations in staging first
- [ ] Backup database before migrations
- [ ] Run migrations during low-traffic periods
- [ ] Monitor migration progress
- [ ] Have rollback plan ready

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Kubernetes Rollback

```bash
# List revisions
kubectl rollout history deployment/api

# Rollback to previous revision
kubectl rollout undo deployment/api

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=2
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d settler backup.dump

# Or run rollback migration
psql $DATABASE_URL -f packages/api/src/db/migrations/rollback/001-rollback.sql
```

---

## Health Checks

### API Health Endpoint

```bash
curl https://api.settler.io/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  }
}
```

### Monitoring

- **Uptime**: Monitor `/health` endpoint
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Centralized logging (Datadog, CloudWatch)
- **Alerts**: Configure alerts for health check failures

---

## Post-Deployment Checklist

- [ ] Verify health endpoint responds
- [ ] Check API endpoints are accessible
- [ ] Verify database connectivity
- [ ] Verify Redis connectivity
- [ ] Test authentication flow
- [ ] Test reconciliation job creation
- [ ] Test webhook delivery
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify monitoring dashboards
- [ ] Update status page
- [ ] Notify team of deployment

---

## Troubleshooting

### Common Issues

**Issue: Deployment fails**
- Check environment variables
- Verify secrets are set
- Check build logs
- Verify dependencies

**Issue: API returns 500 errors**
- Check application logs
- Verify database connectivity
- Check Redis connectivity
- Review recent code changes

**Issue: High latency**
- Check database query performance
- Verify cache is working
- Check external API dependencies
- Review resource limits

---

## Security Considerations

### Production Security

- [ ] Use HTTPS only (TLS 1.3)
- [ ] Enable CORS restrictions
- [ ] Configure rate limiting
- [ ] Enable WAF rules
- [ ] Use secrets management
- [ ] Enable audit logging
- [ ] Regular security scans
- [ ] Keep dependencies updated

---

## Performance Optimization

### Caching

- Enable Redis caching
- Configure cache TTLs
- Use CDN for static assets
- Implement API response caching

### Scaling

- Horizontal scaling (add more pods/instances)
- Database connection pooling
- Redis clustering for high availability
- Load balancing configuration

---

## Disaster Recovery

### Backup Procedures

- **Database**: Daily automated backups
- **Redis**: Snapshot backups
- **Secrets**: Encrypted backups
- **Configuration**: Version controlled

### Recovery Procedures

- **RTO**: 4 hours
- **RPO**: 1 hour
- **Recovery Steps**: Documented in incident runbook

---

**Last Updated:** 2026-01-15  
**Next Review:** Quarterly
