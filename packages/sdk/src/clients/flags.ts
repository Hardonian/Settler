import { SettlerClient } from "../client";

export interface EvaluationContext {
  userId?: string;
  email?: string;
  ip?: string;
  country?: string;
  [key: string]: unknown;
}

export interface FlagEvaluation {
  flagKey: string;
  value: boolean | string | number | Record<string, unknown>;
  variant?: string;
  reason?: string;
}

export class FlagsClient {
  constructor(private client: SettlerClient) {}

  async evaluate(
    flagKey: string,
    context: EvaluationContext = {},
    defaultValue?: boolean | string | number | Record<string, unknown>
  ): Promise<FlagEvaluation> {
    try {
      return await this.client.request<FlagEvaluation>("POST", "/v1/feature-flags/evaluate", {
        body: { flagKey, context, defaultValue },
      });
    } catch (e) {
      if (defaultValue !== undefined) {
        return {
          flagKey,
          value: defaultValue,
          reason: "error_fallback",
        };
      }
      throw e;
    }
  }
}
