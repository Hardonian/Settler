import { execFileSync } from "child_process";
import path from "path";

/**
 * Jest Global Setup
 *
 * Starts the test database container and applies migrations.
 */
export default async function globalSetup() {
  console.log("\n[Jest Setup] Starting test database container...");

  try {
    const composePath = path.resolve(__dirname, "../docker-compose.test.yml");

    // Start the container
    execFileSync("docker-compose", ["-f", composePath, "up", "-d"], { stdio: "inherit" });

    // Wait for Postgres to be ready to accept connections
    console.log("Waiting for database to be ready...");
    let ready = false;
    for (let i = 0; i < 10; i++) {
      try {
        execFileSync("docker", ["exec", "postgres-test", "pg_isready", "-U", "postgres"], {
          stdio: "ignore",
        });
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!ready) throw new Error("PostgreSQL failed to start in time.");

    // Wait for Redis to be ready
    console.log("Waiting for Redis to be ready...");
    let redisReady = false;
    for (let i = 0; i < 10; i++) {
      try {
        execFileSync("docker", ["exec", "redis-test", "redis-cli", "ping"], { stdio: "ignore" });
        redisReady = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!redisReady) throw new Error("Redis failed to start in time.");

    // Apply migrations to the test database
    console.log("Applying migrations...");
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test" },
    });

    console.log("✅ Test environment is ready.");
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error);
    process.exit(1);
  }
}
