import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Also load .env as fallback
dotenv.config();

console.log("✅ Environment variables loaded from .env.local");
