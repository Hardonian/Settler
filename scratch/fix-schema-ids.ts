import fs from "fs";
import path from "path";

const schemaPath = path.resolve("prisma/schema.prisma");
let content = fs.readFileSync(schemaPath, "utf-8");

// Replace @id @default(uuid()) with @id @default(uuid()) @db.Uuid
// We need to handle potential varying number of spaces, but rg showed they mostly follow a pattern.
// To be safe, we'll use a regex.
const newContent = content.replace(
  /@id\s+@default\(uuid\(\)\)(?!\s+@db\.Uuid)/g,
  "@id @default(uuid()) @db.Uuid"
);

fs.writeFileSync(schemaPath, newContent);
console.info("Successfully updated schema.prisma IDs to @db.Uuid");
