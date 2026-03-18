# Settler – AGENTS.md

Last Updated: 2026-02-18

## Purpose

Defines autonomous agent roles, responsibilities, and constraints for **Settler**.

## Global Principles

- Production-grade output only (no placeholders)
- Deterministic file changes; prefer minimal diffs
- Never delete content unless directly conflicting with newer validated structure
- Optimize for clarity, minimal context usage, and high leverage
- User routes must never hard-500 (graceful degradation)

## Agent Roles

- **Architecture Agent:** system design, invariants, boundaries, modular cohesion
- **Code Quality Agent:** lint/typecheck/build, hydration/perf passes, vulnerability hygiene
- **Design Agent:** visual system integrity, tokens, UI coherence, hero/motion alignment
- **Infrastructure Agent:** CI/resilience, env validation, security hardening, deploy readiness
- **Release Agent:** changelog discipline, versioning, smoke verification, rollback notes
- **Documentation Agent:** README/CHANGELOG/ADR updates, eliminates redundancy

## Injection Protocol

When new constraints/skills are added:

1. Append new capability or rule.
2. Refine for clarity and remove duplication.
3. Preserve prior decisions unless superseded by verified improvements.
