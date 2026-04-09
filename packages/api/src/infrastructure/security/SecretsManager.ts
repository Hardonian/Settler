/**
 * Secrets Management
 * Zero Trust: No secrets in code or logs
 */

import { config } from "../../config";
import { logError } from "../../utils/logger";

export interface SecretConfig {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description?: string;
}

export class SecretsManager {
  private static secrets: Map<string, string> = new Map();

  /**
   * Validate all required secrets at startup
   */
  static validateSecrets(secretConfigs: SecretConfig[]): void {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const secretConfig of secretConfigs) {
      const value = process.env[secretConfig.name];

      if (!value) {
        if (secretConfig.required) {
          missing.push(secretConfig.name);
        }
        continue;
      }

      // Check for common mistakes (secrets in code)
      if (this.isLikelyHardcoded(value)) {
        logError(`Secret ${secretConfig.name} appears to be hardcoded`, {
          secretName: secretConfig.name,
        });
        invalid.push(secretConfig.name);
        continue;
      }

      // Run custom validator
      if (secretConfig.validator && !secretConfig.validator(value)) {
        invalid.push(secretConfig.name);
        continue;
      }

      this.secrets.set(secretConfig.name, value);
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required secrets: ${missing.join(", ")}\n` +
          `Please set these environment variables.`
      );
    }

    if (invalid.length > 0) {
      throw new Error(
        `Invalid secrets: ${invalid.join(", ")}\n` + `Please check your environment configuration.`
      );
    }
  }

  /**
   * Get secret value (never log it)
   */
  static getSecret(name: string): string | undefined {
    return this.secrets.get(name) || process.env[name];
  }

  /**
   * Check if value looks like a hardcoded secret
   */
  private static isLikelyHardcoded(value: string): boolean {
    const suspiciousPatterns = [
      /^your-.*-key$/i,
      /^change-.*-production$/i,
      /^test.*key$/i,
      /^12345/,
      /^password$/i,
      /^secret$/i,
      /^default$/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Redact secret from logs
   */
  static redactSecret(value: string, _secretName: string): string {
    // Never log full secrets
    if (value.length <= 8) {
      return "***";
    }
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  /**
   * Mask sensitive data in objects
   */
  static maskSensitiveFields(obj: any, fields: string[]): any {
    const masked = { ...obj };
    for (const field of fields) {
      if (masked[field]) {
        masked[field] = this.redactSecret(String(masked[field]), field);
      }
    }
    return masked;
  }
}

// Required secrets configuration
export const REQUIRED_SECRETS: SecretConfig[] = [
  {
    name: "JWT_SECRET",
    required: true,
    validator: (v) => v.length >= 32,
    description: "JWT signing secret (min 32 chars)",
  },
  {
    name: "JWT_REFRESH_SECRET",
    required: true,
    validator: (v) => v.length >= 32,
    description: "JWT refresh token secret (min 32 chars)",
  },
  {
    name: "ENCRYPTION_KEY",
    required: true,
    validator: (v) => v.length === 32 || v.length === 64,
    description: "AES encryption key (32 or 64 bytes)",
  },
  {
    name: "DB_PASSWORD",
    required: true,
    validator: (v) => v.length >= 8,
    description: "Database password (min 8 chars)",
  },
];

// Validate secrets on module load (in production and preview)
if (config.nodeEnv === "production" || config.nodeEnv === "preview") {
  SecretsManager.validateSecrets(REQUIRED_SECRETS);
}
