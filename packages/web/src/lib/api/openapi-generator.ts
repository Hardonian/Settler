/**
 * OpenAPI/Swagger Schema Generator
 * 
 * Generates OpenAPI 3.0 schemas from Zod schemas and route handlers.
 * Enables API documentation and client generation.
 */

import { z } from 'zod';

export interface OpenAPIRoute {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: z.ZodSchema;
  responseSchema?: z.ZodSchema;
  authRequired?: boolean;
  rateLimit?: string;
}

/**
 * Convert Zod schema to OpenAPI schema
 */
export function zodToOpenAPI(schema: z.ZodSchema): Record<string, unknown> {
  // Basic conversion - can be extended for full Zod support
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToOpenAPI(value as z.ZodType);
      if (!(value as z.ZodType).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return zodTypeToOpenAPI(schema);
}

/**
 * Convert Zod type to OpenAPI type
 */
function zodTypeToOpenAPI(type: z.ZodType): Record<string, unknown> {
  if (type instanceof z.ZodString) {
    const checks = (type._def as { checks?: Array<{ kind: string; value?: unknown }> }).checks;
    const minCheck = checks?.find((c) => c.kind === 'min');
    const maxCheck = checks?.find((c) => c.kind === 'max');
    return {
      type: 'string',
      ...(minCheck && typeof minCheck.value === 'number' && { minLength: minCheck.value }),
      ...(maxCheck && typeof maxCheck.value === 'number' && { maxLength: maxCheck.value }),
    };
  }

  if (type instanceof z.ZodNumber) {
    const checks = (type._def as { checks?: Array<{ kind: string; value?: unknown }> }).checks;
    const minCheck = checks?.find((c) => c.kind === 'min');
    const maxCheck = checks?.find((c) => c.kind === 'max');
    return {
      type: 'number',
      ...(minCheck && typeof minCheck.value === 'number' && { minimum: minCheck.value }),
      ...(maxCheck && typeof maxCheck.value === 'number' && { maximum: maxCheck.value }),
    };
  }

  if (type instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  if (type instanceof z.ZodArray) {
    const def = type._def as unknown as { type?: z.ZodType };
    const innerType = def.type;
    if (innerType) {
      return {
        type: 'array',
        items: zodTypeToOpenAPI(innerType),
      };
    }
    return {
      type: 'array',
      items: {},
    };
  }

  if (type instanceof z.ZodEnum) {
    const def = type._def as unknown as { values?: readonly string[] };
    return {
      type: 'string',
      enum: def.values || [],
    };
  }

  if (type instanceof z.ZodOptional) {
    const def = type._def as unknown as { innerType?: z.ZodType };
    const innerType = def.innerType;
    if (innerType) {
      return zodTypeToOpenAPI(innerType);
    }
    return { type: 'object' };
  }

  return { type: 'object' };
}

/**
 * Generate OpenAPI spec from routes
 */
export function generateOpenAPISpec(routes: OpenAPIRoute[]): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    const pathItem: Record<string, unknown> = {
      summary: route.summary,
      ...(route.description && { description: route.description }),
      ...(route.tags && { tags: route.tags }),
    };

    // Request body
    if (route.requestSchema && ['post', 'put', 'patch'].includes(route.method)) {
      try {
        pathItem.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: zodToOpenAPI(route.requestSchema as z.ZodSchema),
            },
          },
        };
      } catch (error) {
        // Skip if schema conversion fails
        console.warn('Failed to convert request schema to OpenAPI', error);
      }
    }

    // Responses
    pathItem.responses = {
      '200': {
        description: 'Success',
        ...(route.responseSchema && {
          content: {
            'application/json': {
              schema: zodToOpenAPI(route.responseSchema as z.ZodSchema),
            },
          },
        }),
      },
      '400': { description: 'Bad Request' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden' },
      '429': { description: 'Rate Limit Exceeded' },
      '500': { description: 'Internal Server Error' },
    };

    // Security
    if (route.authRequired) {
      pathItem.security = [
        {
          bearerAuth: [],
          apiKeyAuth: [],
        },
      ];
    }

    const pathObj = paths[route.path];
    if (pathObj) {
      pathObj[route.method] = pathItem;
    }
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Settler Console API',
      version: '1.0.0',
      description: 'API for managing Settler console resources',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev',
        description: 'Production',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
  };
}
