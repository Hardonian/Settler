// ROUTE_CLASS: admin-internal
// AUTH: API key + adminRole
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { listPolicies } from "@/lib/control-plane/state";

export const GET = withSecurity(async () => {
  return NextResponse.json({ policies: listPolicies() });
});
