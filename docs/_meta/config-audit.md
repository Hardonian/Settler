# Config Audit

Date: 2026-03-11

## Reviewed config surface

- TypeScript: `tsconfig.json`, `tsconfig.api-adapter.json`, `tsconfig.temp-fix.json`
- Playwright: `playwright.config.ts`, `playwright.prod.config.ts`
- ESLint/Prettier: `eslint.config.js`, `.eslintrc.js`, `.prettierrc`
- Workspace/build: `pnpm-workspace.yaml`, `turbo.json`

## Findings

- `package.json` scripts section contained duplicated conflicting command keys (resolved).
- Multiple tsconfig variants remain; intent appears split between canonical, adapter, and temporary fix layers.
- ESLint has both modern and legacy config files; likely transitional compatibility.

## Actions taken

- Resolved config-adjacent script duplication in `package.json`.

## Needs review

- Consolidate TypeScript configs by documenting inheritance and retirement criteria for `tsconfig.temp-fix.json`.
- Confirm whether `.eslintrc.js` is still required with `eslint.config.js`.
