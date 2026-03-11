# Launch Checklist

## Build, test, and quality gate

- [x] `pnpm run repo-integrity`
- [x] `pnpm run build`
- [x] `pnpm run test`
- [ ] `pnpm run lint`
- [ ] `pnpm run typecheck`

## Demo and artifact gate

- [x] Demo workflow verified (`pnpm run demo`)
- [x] Benchmark summary created
- [ ] Screenshot and demo assets captured (`pnpm demo:assets`)

## Documentation gate

- [x] Launch docs updated
- [x] Checklist consolidated to canonical `docs/launch/` surfaces
- [ ] Release-facing notes validated for current command names and paths
