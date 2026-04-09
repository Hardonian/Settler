# Self-Hosting Settler

Settler is designed to be runnable on your own infrastructure for maximum data privacy and compliance.

## Prerequisites

- Docker & Docker Compose
- 4GB RAM minimum
- PostgreSQL 15+
- Redis 7+

## Quick Start

1. Clone this repository or download the `docker-compose.yml` file.
2. Generate an encryption key:
   ```bash
   openssl rand -hex 32
   ```
3. Create a `.env` file with the key:
   ```
   ENCRYPTION_KEY=your_generated_key_here
   ```
4. Start the services:
   ```bash
   docker-compose up -d
   ```

## Architecture

The self-hosted stack includes:

- **API Service**: Handles HTTP requests (Node.js)
- **Worker Service**: Processes reconciliation jobs and webhooks (Node.js)
- **PostgreSQL**: Ledger and state storage
- **Redis**: Job queues and caching

## Configuration

| Variable         | Description                         | Default |
| ---------------- | ----------------------------------- | ------- |
| `PORT`           | API Port                            | 3000    |
| `DATABASE_URL`   | Postgres Connection String          | -       |
| `REDIS_URL`      | Redis Connection String             | -       |
| `ENCRYPTION_KEY` | 32-byte hex key for data encryption | -       |

## Enterprise Support

For HA configurations, the canonical Helm chart is at `deploy/helm/settler` (`pnpm run verify:helm-packaging` when `helm` is installed). OIDC SSO is configuration-gated per deployment. For assisted rollout, contact [enterprise@settler.dev](mailto:enterprise@settler.dev).
