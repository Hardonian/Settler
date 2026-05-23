// Prisma 7 configuration file
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
import { defineConfig } from "prisma/config";

// DATABASE_URL is optional during prisma generate
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/settler";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
