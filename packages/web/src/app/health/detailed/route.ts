import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    "local";

  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "settler-web",
      services: {
        web: "healthy",
        api: "healthy",
      },
      build: commitSha,
    },
    { status: 200 }
  );
}
