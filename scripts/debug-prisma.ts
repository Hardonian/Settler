import "./env-loader";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.info("Attempting to initialize PrismaClient...");
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    console.info("PrismaClient instance created.");
    console.info("Attempting connection ($connect)...");
    await prisma.$connect();
    console.info("Successfully connected to the database!");
    await prisma.$disconnect();
  } catch (error) {
    console.error("FAILED to initialize or connect:");
    console.error(error);
    process.exit(1);
  }
}

main();
