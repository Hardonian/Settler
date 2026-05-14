# Changelog

All notable changes to Settler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Support intake submission service with audit logging and runtime signal emission
- Standardized error factories and exception management routes
- Support intake system with run/exception context embedding
- Reconciliation export integrity verification

### Security
- Bump defu to ^6.1.5 to fix prototype pollution vulnerability

### Infrastructure
- Force Node.js 24 for GitHub Actions to resolve deprecation warnings

## [1.0.0] - 2026-04-09

### Added
- Initial release of Settler reconciliation platform
- Support intake system for automated customer support
- Exception intelligence with context embedding
- Evidence artifact management
- Audit logging for all operations
- Webhook signature verification
- Multi-tenant architecture with RLS
- Subscription tier management
- Control safety checks with blast radius limiting

### Infrastructure
- PostgreSQL database with Prisma ORM
- Redis for caching and queues
- GitHub Actions CI/CD pipeline
- Docker containerization
- Migration system for schema changes
