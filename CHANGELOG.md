# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-grade observability with trace_id correlation IDs
- Structured JSON logging with trace_id, route, and user context
- Error boundaries with trace_id tracking
- Performance telemetry and /api/metrics endpoint
- Stripe webhook test harness and simulator
- Audit logging table for billing and settings changes
- RLS policy verification documentation
- API contract tests with Zod schemas
- Security scanning workflows (Gitleaks, dependency audit)
- Auth gating utilities for protected endpoints
- Doctor script for system health checks
- Release workflow with changelog generation

### Changed
- All API responses now include trace_id header
- Error responses include trace_id for correlation
- Stripe webhook handler enhanced with trace_id logging
- Health check endpoint includes trace_id

### Security
- Added secret scanning with Gitleaks
- Added dependency audit in CI
- Enhanced auth gating for admin endpoints
- Security headers already in place
