# React.Settler - Internal Design Document

**Status:** Implementation Complete  
**Version:** 0.1.0  
**Date:** 2024-01-01

## Executive Summary

React.Settler is an open-source React component library that enables declarative definition of reconciliation workflows. It decouples UI definition from backend reconciliation engines, allowing developers to build reconciliation UIs using familiar React patterns while maintaining backend flexibility.

## Problem Statement

### Current State

- Reconciliation UIs are tightly coupled to backend engines
- Rule definitions require complex JSON/YAML configuration files
- No standardized protocol for reconciliation workflows
- Difficult to customize reconciliation UIs without backend changes

### Goals

1. Enable declarative reconciliation workflow definition using React
2. Decouple UI from backend reconciliation engines
3. Create a framework-agnostic protocol for reconciliation configs
4. Provide a developer-friendly API similar to react-email
5. Maintain clear OSS boundaries to protect Settler's proprietary engine

## Architecture

### Package Structure

```
packages/
  protocol/           # OSS - Framework-agnostic types
  react-settler/      # OSS - React component library
  api/                # CLOSED - Backend services
  reconciliation-engine/ # CLOSED - Core matching logic
```

### Core Components

#### 1. @settler/protocol

- **Purpose:** Framework-agnostic protocol types
- **License:** MIT
- **Dependencies:** None (pure TypeScript)
- **Exports:** Type definitions, JSON schema

#### 2. @settler/react-settler

- **Purpose:** React component library
- **License:** MIT
- **Dependencies:** React, @settler/protocol
- **Exports:** Components, compiler, types

### Component Architecture

```
ReconciliationDashboard (wrapper)
  ├── CompilationProvider (context)
  ├── TransactionTable (widget)
  ├── ExceptionTable (widget)
  ├── MetricCard (widget)
  └── RuleSet (rule container)
      └── MatchRule (rule definition)
```

### Compilation Flow

1. **UI Mode** (default)
   - Components render normally with live data
   - No compilation occurs
   - Standard React rendering

2. **Config Mode**
   - Components register themselves in compilation context
   - Rules are collected into rulesets
   - Widgets are registered in widget registry
   - Config object is mutated during render
   - Final JSON config is extracted

### Data Flow

```
React Components → Compilation Context → Config Object → JSON
```

## Implementation Details

### Compilation Context

The `CompilationProvider` provides:

- `mode`: 'ui' | 'config'
- `config`: Partial<ReconciliationConfig>
- `widgetRegistry`: Map<string, WidgetConfig>

Components check `mode` to determine behavior:

- `mode === 'ui'`: Render UI
- `mode === 'config'`: Register in config, return null

### Rule Extraction

Rules are extracted during render:

1. `<RuleSet>` creates a ruleset in config.rulesets
2. `<MatchRule>` adds rules to the most recent ruleset
3. Rules are collected synchronously during render

### Widget Registration

Widgets register themselves in config.widgets:

1. Component checks compilation mode
2. If config mode, creates WidgetConfig
3. Registers in config.widgets with unique ID
4. Returns null (no UI rendered)

## Integration Points

### Settler Dashboard Integration

The Settler dashboard (`packages/web`) uses react-settler to:

1. Render reconciliation UIs with live data
2. Compile workflows to JSON for backend storage
3. Display exceptions and transactions
4. Define reconciliation rules visually

### Backend Integration

The compiled JSON config can be:

1. Stored in database
2. Sent to reconciliation engine
3. Used to configure matching logic
4. Rendered by any backend that understands the protocol

## OSS Boundaries

### OSS Packages (MIT License)

- `@settler/protocol` - Protocol types only
- `@settler/react-settler` - React components

### Proprietary Packages (Closed Source)

- `@settler/api` - Backend API
- Reconciliation engine - Core matching algorithms
- Internal services - Business logic

### Boundary Enforcement

1. **No Proprietary Imports**
   - OSS packages cannot import from closed packages
   - TypeScript path aliases enforce this

2. **No Internal URLs**
   - OSS examples use demo/public endpoints only
   - No hardcoded internal API URLs

3. **No Secrets**
   - No API keys or credentials in OSS code
   - Examples use environment variables

4. **Documentation Boundaries**
   - Docs describe protocol behavior
   - Do not expose internal algorithms
   - Examples use generic backends

## Testing Strategy

### Unit Tests

- Component rendering in UI mode
- Config extraction in config mode
- Rule and widget registration
- Compiler correctness

### Integration Tests

- Dashboard integration
- Config compilation end-to-end
- JSON schema validation

### E2E Tests

- Full workflow compilation
- Backend config consumption
- UI rendering with real data

## Rollout Plan

### Phase 1: Foundation (Week 1) ✅

- [x] Protocol types package
- [x] Basic React components
- [x] Config compiler
- [x] Documentation

### Phase 2: Integration (Week 2) ✅

- [x] Dashboard integration
- [x] Dogfooding with real data
- [x] Backend config storage
- [x] Examples and guides

### Phase 3: Polish & Release (Week 3)

- [ ] Additional components
- [ ] Theme support
- [ ] Performance optimization
- [ ] Open source release
- [ ] Community kickoff

## Future Enhancements

### Short Term

- More widget types (charts, filters, search)
- Rich rule DSL
- Theme customization
- TypeScript strict mode improvements

### Long Term

- Visual rule builder
- Rule testing framework
- Plugin system for custom widgets
- Protocol versioning and migration tools

## Risks & Mitigations

### Risk: Compiler Complexity

**Mitigation:** Keep compilation simple, use React's rendering for extraction

### Risk: OSS Boundary Violations

**Mitigation:** Automated checks, code reviews, clear documentation

### Risk: Adoption Challenges

**Mitigation:** Comprehensive docs, examples, developer-friendly API

## Success Metrics

- [ ] 100+ GitHub stars in first month
- [ ] 10+ external contributors
- [ ] Used in 3+ external projects
- [ ] Zero OSS boundary violations
- [ ] Positive developer feedback

## Conclusion

React.Settler provides a clean separation between UI definition and backend reconciliation engines, enabling developers to build reconciliation workflows declaratively while maintaining backend flexibility. The clear OSS boundaries protect Settler's proprietary engine while enabling open innovation in reconciliation UI development.
