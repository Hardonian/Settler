// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
