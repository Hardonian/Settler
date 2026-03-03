import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    server: "settler-web",
    build: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    engine_version: "recon-v1",
    policy_version: "2026-02-18",
  });
}
