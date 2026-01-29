/**
 * Environment Configuration
 * Centralized environment variable validation and access
 */

import { z } from "zod";

const envSchema = z.object({
  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://settler.dev"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://settler.dev"),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-3.5-turbo"),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_AUDIENCE_ID: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Auth
  INVESTOR_API_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Feature Flags
  ENABLE_CHATBOT: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .optional(),
  ENABLE_ANALYTICS: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .optional(),
  ENABLE_NEWSLETTER: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .optional(),
  ENABLE_IMAGE_OPTIMIZATION: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .optional(),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"] as const).default("development"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    env = envSchema.parse(process.env);
  }
  return env;
}

export function requireEnv<K extends keyof Env>(key: K): Env[K] {
  const value = getEnv()[key];
  if (value === undefined || value === null) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
