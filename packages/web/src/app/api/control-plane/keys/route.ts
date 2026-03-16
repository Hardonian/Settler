// ROUTE_CLASS: admin-internal
// AUTH: API key + adminRole
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";

interface ApiKeyView {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

function keyPrefix(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 4)}****`;
  }
  return `${trimmed.slice(0, 8)}****`;
}

export const GET = withSecurity(async () => {
  const keys: ApiKeyView[] = [];

  if (process.env.OPENAI_API_KEY) {
    keys.push({
      id: "openai-key",
      name: "OpenAI Provider Key",
      keyPrefix: keyPrefix(process.env.OPENAI_API_KEY),
      createdAt: new Date().toISOString(),
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    keys.push({
      id: "anthropic-key",
      name: "Anthropic Provider Key",
      keyPrefix: keyPrefix(process.env.ANTHROPIC_API_KEY),
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ keys });
});
