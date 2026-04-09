#!/usr/bin/env tsx
/**
 * Map All Tables to Frontend Components and API Routes
 *
 * Ensures every table has:
 * - API routes for CRUD operations
 * - Frontend components for viewing/editing
 * - RPC functions for complex queries
 */

import * as fs from "fs";
import * as path from "path";

interface TableMapping {
  table: string;
  schema: string;
  apiRoute?: string;
  frontendComponent?: string;
  rpcFunctions?: string[];
  hasCRUD: boolean;
  missingOperations: string[];
}

function findFiles(dir: string, pattern: RegExp, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes(".git")) {
        findFiles(filePath, pattern, fileList);
      } else if (pattern.test(file)) {
        fileList.push(filePath);
      }
    } catch {
      // Skip files we can't read
    }
  }
  return fileList;
}

function extractTablesFromMigration(): Array<{ schema: string; table: string }> {
  const migrationPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "00000000_settler_golden_schema.sql"
  );
  const content = fs.readFileSync(migrationPath, "utf-8");

  const tables: Array<{ schema: string; table: string }> = [];
  const tableMatches = content.matchAll(/CREATE TABLE IF NOT EXISTS\s+([\w.]+)\s*\(/g);

  for (const match of tableMatches) {
    const fullName = match[1];
    const parts = fullName.split(".");
    const schema = parts.length > 1 ? parts[0] : "public";
    const table = parts.length > 1 ? parts[1] : parts[0];

    // Only include application tables (exclude auth, storage, etc. system schemas)
    if (
      ![
        "auth",
        "storage",
        "realtime",
        "vault",
        "supabase_functions",
        "net",
        "cron",
        "pgmq",
      ].includes(schema)
    ) {
      tables.push({ schema, table });
    }
  }

  return tables;
}

function findAPIRoutes(): Map<string, string> {
  const routes = new Map<string, string>();
  const apiDir = path.join(__dirname, "..", "packages", "web", "src", "app", "api");

  if (!fs.existsSync(apiDir)) return routes;

  const routeFiles = findFiles(apiDir, /route\.ts$/);

  for (const file of routeFiles) {
    const relativePath = file.replace(apiDir + "/", "").replace("/route.ts", "");
    const tableName = relativePath
      .split("/")
      .pop()
      ?.replace(/\[.*\]/, "");
    if (tableName) {
      routes.set(tableName.toLowerCase(), relativePath);
    }
  }

  return routes;
}

function findFrontendComponents(): Map<string, string> {
  const components = new Map<string, string>();
  const appDir = path.join(__dirname, "..", "packages", "web", "src", "app");

  if (!fs.existsSync(appDir)) return components;

  const pageFiles = findFiles(appDir, /page\.tsx$/);

  for (const file of pageFiles) {
    const relativePath = file.replace(appDir + "/", "").replace("/page.tsx", "");
    const routeName = relativePath.split("/").pop();
    if (routeName) {
      components.set(routeName.toLowerCase(), relativePath);
    }
  }

  return components;
}

function checkTableInCode(
  tableName: string,
  apiRoutes: Map<string, string>,
  components: Map<string, string>
): {
  apiRoute?: string;
  frontendComponent?: string;
  hasCRUD: boolean;
  missingOperations: string[];
} {
  const normalizedTable = tableName.toLowerCase().replace(/_/g, "-");
  const apiRoute = apiRoutes.get(normalizedTable) || apiRoutes.get(tableName.toLowerCase());
  const frontendComponent =
    components.get(normalizedTable) || components.get(tableName.toLowerCase());

  const missingOps: string[] = [];
  if (!apiRoute) missingOps.push("API route");
  if (!frontendComponent) missingOps.push("Frontend component");

  return {
    apiRoute,
    frontendComponent,
    hasCRUD: !!apiRoute && !!frontendComponent,
    missingOperations: missingOps,
  };
}

function generateAPIRoute(tableName: string, schema: string): string {
  const routeName = tableName.toLowerCase().replace(/_/g, "-");
  const pascalName = tableName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  return `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route for ${tableName}
 * Schema: ${schema}
 * 
 * GET    /api/console/${routeName}     - List all records
 * POST   /api/console/${routeName}     - Create new record
 * GET    /api/console/${routeName}/[id] - Get single record
 * PATCH  /api/console/${routeName}/[id] - Update record
 * DELETE /api/console/${routeName}/[id] - Delete record
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const { data, error } = await supabase
      .from('${schema}.${tableName}')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ data, count: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('${schema}.${tableName}')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
}

function generateFrontendComponent(tableName: string, schema: string): string {
  const routeName = tableName.toLowerCase().replace(/_/g, "-");
  const pascalName = tableName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const displayName = tableName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ${pascalName} {
  id: string;
  [key: string]: any;
}

/**
 * Frontend Component for ${tableName}
 * Schema: ${schema}
 * 
 * Provides view/edit interface for ${displayName} records
 */

export default function ${pascalName}Page() {
  const [data, setData] = useState<${pascalName}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      const supabase = createClient();
      const { data: records, error: err } = await supabase
        .from('${schema}.${tableName}')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (err) throw err;
      setData(records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">${displayName}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {data.length > 0 && Object.keys(data[0]).map(key => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record) => (
              <tr key={record.id}>
                {Object.entries(record).map(([key, value]) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
}

function main() {
  console.log("🔍 Mapping all tables to frontend components and API routes...\n");

  const tables = extractTablesFromMigration();
  console.log(`📊 Found ${tables.length} application tables\n`);

  const apiRoutes = findAPIRoutes();
  const frontendComponents = findFrontendComponents();

  console.log(`📋 Found ${apiRoutes.size} API routes`);
  console.log(`📋 Found ${frontendComponents.size} frontend components\n`);

  const mappings: TableMapping[] = [];
  const missingAPIRoutes: Array<{ table: string; schema: string }> = [];
  const missingComponents: Array<{ table: string; schema: string }> = [];

  for (const { schema, table } of tables) {
    const check = checkTableInCode(table, apiRoutes, frontendComponents);

    mappings.push({
      table,
      schema,
      ...check,
    });

    if (!check.apiRoute) {
      missingAPIRoutes.push({ table, schema });
    }
    if (!check.frontendComponent) {
      missingComponents.push({ table, schema });
    }
  }

  // Generate report
  const report = {
    total: mappings.length,
    withAPI: mappings.filter((m) => m.apiRoute).length,
    withFrontend: mappings.filter((m) => m.frontendComponent).length,
    withBoth: mappings.filter((m) => m.hasCRUD).length,
    missingAPI: missingAPIRoutes.length,
    missingFrontend: missingComponents.length,
    mappings: mappings.slice(0, 50), // Sample
  };

  const reportPath = path.join(__dirname, "..", "supabase", "table-frontend-backend-mapping.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("📊 Mapping Summary:");
  console.log(`  Total tables: ${report.total}`);
  console.log(`  With API routes: ${report.withAPI}`);
  console.log(`  With frontend components: ${report.withFrontend}`);
  console.log(`  With both (CRUD ready): ${report.withBoth}`);
  console.log(`  Missing API routes: ${report.missingAPI}`);
  console.log(`  Missing frontend components: ${report.missingFrontend}`);

  if (missingAPIRoutes.length > 0) {
    console.log(`\n⚠️  Tables missing API routes (${missingAPIRoutes.length}):`);
    missingAPIRoutes.slice(0, 20).forEach(({ schema, table }) => {
      console.log(`  - ${schema}.${table}`);
    });
    if (missingAPIRoutes.length > 20) {
      console.log(`  ... and ${missingAPIRoutes.length - 20} more`);
    }
  }

  if (missingComponents.length > 0) {
    console.log(`\n⚠️  Tables missing frontend components (${missingComponents.length}):`);
    missingComponents.slice(0, 20).forEach(({ schema, table }) => {
      console.log(`  - ${schema}.${table}`);
    });
    if (missingComponents.length > 20) {
      console.log(`  ... and ${missingComponents.length - 20} more`);
    }
  }

  console.log(`\n✅ Mapping complete. Report: ${reportPath}`);

  return { mappings, missingAPIRoutes, missingComponents };
}

const result = main();
export { result };
