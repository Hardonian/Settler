/**
 * AI Configuration
 */

export interface AIConfig {
  defaultModel: string;
  modelTier: "basic" | "standard" | "advanced";
  maxTokens: number;
  temperature: number;
}

export const aiConfig: AIConfig = {
  defaultModel: "gpt-4o-mini",
  modelTier: "standard",
  maxTokens: 4000,
  temperature: 0.7,
};

export const AI_CONFIG = aiConfig;
