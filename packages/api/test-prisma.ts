import { prisma } from "./src/infrastructure/db/prisma";

async function run() {
  console.log(prisma);
}

run().catch(console.error);
