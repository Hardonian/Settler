#!/usr/bin/env node

/**
 * Script to add runtime configuration to all API routes that use Prisma
 * This ensures Prisma uses the binary engine instead of client engine
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const webApiDir = path.join(__dirname, "../packages/web/src/app/api");

// Find all route.ts files that use Prisma
const findPrismaRoutes = () => {
  try {
    const result = execSync(
      `find ${webApiDir} -name "route.ts" -type f -exec grep -l "prisma" {} \\;`,
      { encoding: "utf-8" }
    );
    return result.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error finding Prisma routes:", error.message);
    return [];
  }
};

const addRuntimeConfig = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, "utf-8");

    // Skip if already has runtime config
    if (content.includes("export const runtime")) {
      return false;
    }

    // Add runtime config after dynamic export
    if (content.includes("export const dynamic")) {
      content = content.replace(
        /(export const dynamic[^\n]*\n)/,
        "$1export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine\n"
      );
    } else {
      // Add at the top after imports
      const importEnd = content.lastIndexOf("import");
      if (importEnd !== -1) {
        const nextLine = content.indexOf("\n", importEnd);
        if (nextLine !== -1) {
          content =
            content.slice(0, nextLine + 1) +
            "export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine\n" +
            content.slice(nextLine + 1);
        }
      }
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const routes = findPrismaRoutes();
let updated = 0;

routes.forEach((route) => {
  if (addRuntimeConfig(route)) {
    console.log(`✓ Updated: ${route}`);
    updated++;
  }
});

console.log(`\nUpdated ${updated} of ${routes.length} Prisma routes with runtime configuration.`);
