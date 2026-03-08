import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", dependencies: { db: "up" } });
  } catch {
    return NextResponse.json(
      { status: "degraded", dependencies: { db: "down" }, error: "SETTLER_INTERNAL" },
      { status: 503 }
    );
  }
}
