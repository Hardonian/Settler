#!/usr/bin/env node
/**
 * Settler Internal CLI
 * Development workflow automation tool
 */

import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

program.name("settler").description("Settler development CLI").version("1.0.0");

// Scaffold command
program
  .command("scaffold")
  .description("Scaffold new component or feature")
  .argument("<type>", "Type: component, page, api, integration")
  .argument("<name>", "Name of the item")
  .action((type, name) => {
    console.log(`Scaffolding ${type}: ${name}`);

    const templates: Record<string, (name: string) => void> = {
      component: (name) => {
        const dir = `packages/web/src/components/${name}`;
        fs.mkdirSync(dir, { recursive: true });
        const content = `"use client";

import { } from "react";

export function ${name.charAt(0).toUpperCase() + name.slice(1)}() {
  return (
    <div>
      {/* ${name} component */}
    </div>
  );
}
`;
        fs.writeFileSync(`${dir}/${name}.tsx`, content);
        console.log(`Created component: ${dir}/${name}.tsx`);
      },
      page: (name) => {
        const dir = `packages/web/src/app/${name}`;
        fs.mkdirSync(dir, { recursive: true });
        const content = `export default function ${name.charAt(0).toUpperCase() + name.slice(1)}Page() {
  return (
    <div>
      {/* ${name} page */}
    </div>
  );
}
`;
        fs.writeFileSync(`${dir}/page.tsx`, content);
        console.log(`Created page: ${dir}/page.tsx`);
      },
      api: (name) => {
        const dir = `packages/web/src/app/api/${name}`;
        fs.mkdirSync(dir, { recursive: true });
        const content = `import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ message: "${name} API" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
`;
        fs.writeFileSync(`${dir}/route.ts`, content);
        console.log(`Created API route: ${dir}/route.ts`);
      },
    };

    if (templates[type]) {
      templates[type](name);
    } else {
      console.error(`Unknown type: ${type}`);
      process.exit(1);
    }
  });

// Migrations command
program
  .command("migration")
  .description("Create or run database migrations")
  .argument("<action>", "Action: create, run, rollback")
  .argument("[name]", "Migration name (for create)")
  .action((action, name) => {
    if (action === "create" && name) {
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
      const filename = `supabase/migrations/${timestamp}_${name}.sql`;
      const content = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your migration SQL here

COMMIT;
`;
      fs.writeFileSync(filename, content);
      console.log(`Created migration: ${filename}`);
    } else if (action === "run") {
      console.log("Running migrations...");
      execSync("npx supabase migration up", { stdio: "inherit" });
    } else if (action === "rollback") {
      console.log("Rolling back last migration...");
      execSync("npx supabase migration down", { stdio: "inherit" });
    }
  });

// Logs command
program
  .command("logs")
  .description("View application logs")
  .option("-f, --follow", "Follow log output")
  .option("-n, --lines <number>", "Number of lines", "100")
  .action((options) => {
    console.log(`Viewing logs (last ${options.lines} lines)`);
    // In production, fetch from log aggregation service
  });

program.parse();
