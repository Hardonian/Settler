# Source of Truth Documentation

## Overview

This document defines the authoritative sources of truth for Settler Enterprise.

## Documentation Hierarchy

### Primary Sources (Authoritative)

1. **README.md** - Main project documentation
   - Quick start guide
   - Architecture overview
   - Platform components

2. **docs/CONSOLE.md** - Console user guide
   - Feature documentation
   - API endpoints
   - Access control

3. **docs/API.md** - API documentation
   - Endpoint reference
   - Authentication
   - Rate limits

4. **docs/ARCHITECTURE.md** - System architecture
   - Architecture layers
   - Database schema
   - Security architecture

5. **CHANGELOG.md** - Version history
   - All changes documented
   - Version tracking

6. **RELEASE_NOTES.md** - Release information
   - Feature highlights
   - Upgrade guides

### Secondary Sources (Reference)

1. **docs/CITATIONS.md** - Implementation references
   - File locations
   - Code references

2. **archive/completed-work/** - Historical documentation
   - Completed work summaries
   - Implementation details

3. **scripts/README.md** - Script documentation
   - Script usage
   - Testing procedures

## Code as Source of Truth

### Database Schema
- **Location**: `supabase/migrations/`
- **Format**: SQL migration files
- **Authority**: Migrations define actual schema

### API Contracts
- **Location**: `packages/web/src/app/api/`
- **Format**: TypeScript route handlers
- **Authority**: Code defines actual API behavior

### Type Definitions
- **Location**: `packages/web/src/types/`
- **Format**: TypeScript type definitions
- **Authority**: Types define data structures

## Documentation Standards

### Markdown Files
- Use Markdown format
- Include code examples
- Keep up to date with code

### Code Comments
- JSDoc for functions
- Inline comments for complex logic
- No commented-out code

### README Files
- One README per directory
- Explain purpose and usage
- Link to related docs

## Version Control

### Git Tags
- Tag releases: `v1.0.0`
- Tag major changes
- Include release notes

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- Feature branches for new work

## Maintenance

### Regular Updates
- Update docs with code changes
- Review quarterly
- Archive outdated docs

### Documentation Review
- Code review includes docs
- Update docs before release
- Verify examples work

## Related Documentation

- [Main README](../README.md)
- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Architecture Documentation](./ARCHITECTURE.md)
