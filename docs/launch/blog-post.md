# Launch Blog Post

## Problem

Reconciliation systems often fail silently and are hard to verify.

## Current tool limitations

Many tools expose dashboards but not deterministic replay proof.

## Settler architecture

Monorepo with `@settler/api`, `@settler/web`, and `@settler/cli`, tied together by verification scripts.

## Proof execution model

Runs produce evidence artifacts; replay tooling checks integrity and consistency.

## How to try it

`pnpm run bootstrap` → `pnpm run demo` → `pnpm run verify`.
