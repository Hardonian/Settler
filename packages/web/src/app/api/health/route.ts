import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json(
    { status: "healthy", timestamp: new Date().toISOString() },
    { status: 200 }
  );
};
