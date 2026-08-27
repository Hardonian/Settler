import { createOpenAI } from "@ai-sdk/openai";
import dotenv from "dotenv";
import path from "path";

// Attempt to load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/**
 * Initializes the AI provider using BYOK (Bring Your Own Key).
 * Supports OpenAI out of the box.
 *
 * @returns The initialized AI provider, or null if no key is found.
 */
export function getAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[AI-Core] ⚠️ No OPENAI_API_KEY found in environment. Operating in degraded mode."
    );
    return null;
  }

  // Strict BYOK configuration
  return createOpenAI({
    apiKey,
  });
}
