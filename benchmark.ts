import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Seed data
  await prisma.usageEvent.deleteMany({
    where: { eventType: "ai_request" },
  });

  const events = [];
  const models = ["gpt-4", "gpt-3.5", "claude", "unknown"];
  for (let i = 0; i < 10000; i++) {
    events.push({
      billingAccountId: "00000000-0000-0000-0000-000000000000",
      eventType: "ai_request",
      timestamp: new Date(),
      quantity: 1,
      metadata: {
        model: models[i % models.length],
        cost: Math.random() * 0.5,
        tokens: Math.floor(Math.random() * 1000),
      },
    });
  }

  // Actually, we need to create a dummy billing account first or just use query raw for speed.
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
