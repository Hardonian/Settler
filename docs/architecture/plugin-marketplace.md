# Plugin / Integration Marketplace

Settler currently exposes plugin lifecycle primitives in:

- `packages/api/src/infrastructure/plugins/plugin-system.ts`
- `packages/api/src/services/plugins/plugin-manager.ts`

## Marketplace baseline requirements

- registration and version metadata
- dependency and lifecycle management
- sandboxed execution model for external adapters/connectors
- security validation and tenant isolation gates

## Supported integration classes

- workflow adapters
- policy extensions
- analytics exporters
- external service connectors

The control-plane endpoints are designed to surface plugin performance and failure behavior in the same tenant-scoped observability stream.
