/**
 * Adapter Configuration Validator
 * Provides clear schema validation for adapter configs
 * Part of UX-002: Adapter config schema clarity
 */

import { ValidationError } from "./typed-errors";

export interface AdapterConfigSchema {
  required: string[];
  optional?: string[];
  fields?: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array";
      description?: string;
      example?: unknown;
    }
  >;
}

// Adapter config schemas
export const ADAPTER_CONFIG_SCHEMAS: Record<string, AdapterConfigSchema> = {
  stripe: {
    required: ["apiKey"],
    optional: ["webhookSecret"],
    fields: {
      apiKey: {
        type: "string",
        description: "Stripe secret API key (starts with sk_live_ or sk_test_)",
        example: "sk_live_...",
      },
      webhookSecret: {
        type: "string",
        description: "Stripe webhook secret (optional, for webhook verification)",
        example: "whsec_...",
      },
    },
  },
  shopify: {
    required: ["apiKey", "shopDomain"],
    optional: ["webhookSecret"],
    fields: {
      apiKey: {
        type: "string",
        description: "Shopify Admin API access token (starts with shpat_)",
        example: "shpat_...",
      },
      shopDomain: {
        type: "string",
        description: "Shopify shop domain (e.g., your-shop.myshopify.com)",
        example: "your-shop.myshopify.com",
      },
      webhookSecret: {
        type: "string",
        description: "Shopify webhook secret (optional)",
      },
    },
  },
  paypal: {
    required: ["clientId", "clientSecret"],
    optional: ["sandbox"],
    fields: {
      clientId: {
        type: "string",
        description: "PayPal REST API client ID",
        example: "AeA1QIZXiflr1_-...",
      },
      clientSecret: {
        type: "string",
        description: "PayPal REST API client secret",
        example: "...",
      },
      sandbox: {
        type: "boolean",
        description: "Use PayPal sandbox environment (default: false)",
        example: false,
      },
    },
  },
  quickbooks: {
    required: ["clientId", "clientSecret", "realmId"],
    optional: ["accessToken", "refreshToken"],
    fields: {
      clientId: {
        type: "string",
        description: "QuickBooks OAuth client ID",
        example: "Q0...",
      },
      clientSecret: {
        type: "string",
        description: "QuickBooks OAuth client secret",
        example: "...",
      },
      realmId: {
        type: "string",
        description: "QuickBooks company ID (realm ID)",
        example: "123456789",
      },
      accessToken: {
        type: "string",
        description: "OAuth access token (if using OAuth flow)",
      },
      refreshToken: {
        type: "string",
        description: "OAuth refresh token (if using OAuth flow)",
      },
    },
  },
  square: {
    required: ["accessToken"],
    optional: ["environment"],
    fields: {
      accessToken: {
        type: "string",
        description: "Square API access token",
        example: "EAAA...",
      },
      environment: {
        type: "string",
        description: "Square environment (sandbox or production)",
        example: "production",
      },
    },
  },
  xero: {
    required: ["clientId", "clientSecret", "tenantId"],
    optional: ["accessToken", "refreshToken"],
    fields: {
      clientId: {
        type: "string",
        description: "Xero OAuth client ID",
        example: "...",
      },
      clientSecret: {
        type: "string",
        description: "Xero OAuth client secret",
        example: "...",
      },
      tenantId: {
        type: "string",
        description: "Xero tenant ID (organization ID)",
        example: "...",
      },
      accessToken: {
        type: "string",
        description: "OAuth access token (if using OAuth flow)",
      },
      refreshToken: {
        type: "string",
        description: "OAuth refresh token (if using OAuth flow)",
      },
    },
  },
};

/**
 * Validate adapter configuration
 * @param adapter - Adapter name
 * @param config - Configuration object
 * @throws ValidationError if config is invalid
 */
export function validateAdapterConfig(adapter: string, config: Record<string, unknown>): void {
  const schema = ADAPTER_CONFIG_SCHEMAS[adapter.toLowerCase()];

  if (!schema) {
    throw new ValidationError(`Adapter '${adapter}' is not supported`, "adapter", [
      {
        field: "adapter",
        message: `Adapter '${adapter}' is not supported. Supported adapters: ${Object.keys(ADAPTER_CONFIG_SCHEMAS).join(", ")}`,
        code: "INVALID_ADAPTER",
      },
    ]);
  }

  const errors: Array<{ field: string; message: string; code: string }> = [];

  // Check required fields
  for (const requiredField of schema.required) {
    if (
      !(requiredField in config) ||
      config[requiredField] === undefined ||
      config[requiredField] === null ||
      config[requiredField] === ""
    ) {
      errors.push({
        field: requiredField,
        message: `Required field '${requiredField}' is missing`,
        code: "REQUIRED_FIELD_MISSING",
      });
    }
  }

  // Validate field types
  if (schema.fields) {
    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      if (fieldName in config && config[fieldName] !== undefined && config[fieldName] !== null) {
        const value = config[fieldName];
        const expectedType = fieldDef.type;

        if (expectedType === "string" && typeof value !== "string") {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a string`,
            code: "INVALID_FIELD_TYPE",
          });
        } else if (expectedType === "number" && typeof value !== "number") {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a number`,
            code: "INVALID_FIELD_TYPE",
          });
        } else if (expectedType === "boolean" && typeof value !== "boolean") {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a boolean`,
            code: "INVALID_FIELD_TYPE",
          });
        } else if (expectedType === "array" && !Array.isArray(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be an array`,
            code: "INVALID_FIELD_TYPE",
          });
        }
      }
    }
  }

  // Check for unknown fields
  const allFields = [
    ...schema.required,
    ...(schema.optional || []),
    ...(schema.fields ? Object.keys(schema.fields) : []),
  ];
  for (const fieldName of Object.keys(config)) {
    if (!allFields.includes(fieldName)) {
      errors.push({
        field: fieldName,
        message: `Unknown field '${fieldName}'. Valid fields: ${allFields.join(", ")}`,
        code: "UNKNOWN_FIELD",
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Invalid configuration for adapter '${adapter}'`, "config", errors);
  }
}

/**
 * Get adapter config schema (for API docs)
 */
export function getAdapterConfigSchema(adapter: string): AdapterConfigSchema | null {
  return ADAPTER_CONFIG_SCHEMAS[adapter.toLowerCase()] || null;
}

/**
 * List all supported adapters with their config schemas
 */
export function listAdapters(): Array<{
  id: string;
  name: string;
  configSchema: AdapterConfigSchema;
}> {
  const adapterNames: Record<string, string> = {
    stripe: "Stripe",
    shopify: "Shopify",
    paypal: "PayPal",
    quickbooks: "QuickBooks",
    square: "Square",
    xero: "Xero",
  };

  return Object.entries(ADAPTER_CONFIG_SCHEMAS).map(([id, schema]) => ({
    id,
    name: adapterNames[id] || id,
    configSchema: schema,
  }));
}
