#!/usr/bin/env tsx
import { writeFileSync } from "node:fs";

writeFileSync(
  "docs/assets/screenshots/dashboard-capture-readme.txt",
  "Use playwright-based visual tests (tests/e2e/*.spec.ts) to produce dashboard screenshots in CI/local browser environments."
);

console.log("Wrote docs/assets/screenshots/dashboard-capture-readme.txt");
