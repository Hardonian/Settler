#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync("pnpm", ["demo"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
