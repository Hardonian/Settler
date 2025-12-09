/**
 * AI Auto-Documentation for APIs and Integrations
 * Automatically generates documentation from code and schemas
 */

export interface APIDocumentation {
  endpoint: string;
  method: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    schema: Record<string, unknown>;
    example: unknown;
  };
  responses: Array<{
    status: number;
    description: string;
    schema?: Record<string, unknown>;
  }>;
}

export interface IntegrationDocumentation {
  integrationId: string;
  name: string;
  description: string;
  setupSteps: string[];
  configuration: Array<{
    field: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  examples: Array<{
    title: string;
    code: string;
    language: string;
  }>;
  troubleshooting: Array<{
    issue: string;
    solution: string;
  }>;
}

/**
 * Generate API documentation from endpoint definition
 */
export function generateAPIDocumentation(
  endpoint: string,
  method: string,
  _handler: unknown
): APIDocumentation {
  // In production, analyze handler code to extract:
  // - Parameters
  // - Request body schema
  // - Response types
  // - Error cases

  return {
    endpoint,
    method,
    description: `API endpoint for ${endpoint}`,
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
      },
      {
        status: 400,
        description: "Bad Request",
      },
      {
        status: 401,
        description: "Unauthorized",
      },
      {
        status: 500,
        description: "Internal Server Error",
      },
    ],
  };
}

/**
 * Generate integration documentation
 */
export function generateIntegrationDocumentation(integrationId: string): IntegrationDocumentation {
  // In production, analyze integration adapter code to extract:
  // - Configuration requirements
  // - API endpoints used
  // - Data transformations
  // - Error handling

  return {
    integrationId,
    name: integrationId.charAt(0).toUpperCase() + integrationId.slice(1),
    description: `Documentation for ${integrationId} integration`,
    setupSteps: [
      `Get your ${integrationId} API credentials`,
      `Navigate to Integrations in Settler dashboard`,
      `Click "Connect" on ${integrationId}`,
      `Enter your API key`,
      `Test the connection`,
      `Save the integration`,
    ],
    configuration: [
      {
        field: "api_key",
        type: "string",
        required: true,
        description: `Your ${integrationId} API key`,
      },
    ],
    examples: [
      {
        title: "Basic Setup",
        code: `const integration = await settler.integrations.connect({
  integration: "${integrationId}",
  config: {
    api_key: "your_api_key"
  }
});`,
        language: "typescript",
      },
    ],
    troubleshooting: [
      {
        issue: "Invalid API key",
        solution: "Verify your API key is correct and has not expired",
      },
      {
        issue: "Connection timeout",
        solution: "Check your network connection and firewall settings",
      },
    ],
  };
}

/**
 * Auto-generate OpenAPI spec from API routes
 */
export function generateOpenAPISpec(routes: APIDocumentation[]): Record<string, unknown> {
  return {
    openapi: "3.0.0",
    info: {
      title: "Settler API",
      version: "1.0.0",
      description: "Reconciliation-as-a-Service API",
    },
    paths: routes.reduce(
      (paths, route) => {
        paths[route.endpoint] = {
          [route.method.toLowerCase()]: {
            summary: route.description,
            parameters: route.parameters.map((param) => ({
              name: param.name,
              in: "query",
              required: param.required,
              schema: { type: param.type },
              description: param.description,
            })),
            requestBody: route.requestBody
              ? {
                  content: {
                    "application/json": {
                      schema: route.requestBody.schema,
                      example: route.requestBody.example,
                    },
                  },
                }
              : undefined,
            responses: route.responses.reduce(
              (responses, res) => {
                responses[res.status] = {
                  description: res.description,
                  content: res.schema
                    ? {
                        "application/json": {
                          schema: res.schema,
                        },
                      }
                    : undefined,
                };
                return responses;
              },
              {} as Record<string, unknown>
            ),
          },
        };
        return paths;
      },
      {} as Record<string, unknown>
    ),
  };
}
