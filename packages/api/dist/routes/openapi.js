"use strict";
/**
 * OpenAPI/Swagger Documentation
 * Auto-generated API documentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiRouter = void 0;
const express_1 = require("express");
const config_1 = require("../config");
const router = (0, express_1.Router)();
exports.openApiRouter = router;
// OpenAPI 3.0 specification
const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Settler API',
        version: '1.0.0',
        description: 'Reconciliation-as-a-Service API - Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems',
        contact: {
            name: 'Settler Support',
            email: 'support@settler.io',
            url: 'https://settler.io',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'https://api.settler.io',
            description: 'Production',
        },
        {
            url: 'https://api-staging.settler.io',
            description: 'Staging',
        },
        {
            url: 'http://localhost:3000',
            description: 'Local Development',
        },
    ],
    tags: [
        {
            name: 'Jobs',
            description: 'Reconciliation job management',
        },
        {
            name: 'Reports',
            description: 'Reconciliation reports and results',
        },
        {
            name: 'Webhooks',
            description: 'Webhook management',
        },
        {
            name: 'Adapters',
            description: 'Platform adapter management',
        },
        {
            name: 'Auth',
            description: 'Authentication and authorization',
        },
        {
            name: 'Health',
            description: 'Health checks and monitoring',
        },
    ],
    paths: {
        '/api/v1/jobs': {
            get: {
                tags: ['Jobs'],
                summary: 'List reconciliation jobs',
                description: 'Retrieve a list of all reconciliation jobs for the authenticated user',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Maximum number of jobs to return',
                        schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
                    },
                    {
                        name: 'offset',
                        in: 'query',
                        description: 'Number of jobs to skip',
                        schema: { type: 'integer', default: 0, minimum: 0 },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Job' },
                                        },
                                        pagination: { $ref: '#/components/schemas/Pagination' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '500': { $ref: '#/components/responses/InternalServerError' },
                },
            },
            post: {
                tags: ['Jobs'],
                summary: 'Create a new reconciliation job',
                description: 'Create a new reconciliation job with source and target adapters',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateJobRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Job created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Job' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '500': { $ref: '#/components/responses/InternalServerError' },
                },
            },
        },
        '/api/v1/jobs/{id}': {
            get: {
                tags: ['Jobs'],
                summary: 'Get a reconciliation job',
                description: 'Retrieve details of a specific reconciliation job',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Job ID',
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Job' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/api/v1/reports/{jobId}': {
            get: {
                tags: ['Reports'],
                summary: 'Get reconciliation report',
                description: 'Retrieve reconciliation report for a specific job',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'jobId',
                        in: 'path',
                        required: true,
                        description: 'Job ID',
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Report' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Health check',
                description: 'Basic health check endpoint',
                responses: {
                    '200': {
                        description: 'Service is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'healthy' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        service: { type: 'string', example: 'settler-api' },
                                        version: { type: 'string', example: '1.0.0' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token obtained from /api/v1/auth/login',
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for authentication',
            },
        },
        schemas: {
            Job: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    source: { $ref: '#/components/schemas/AdapterConfig' },
                    target: { $ref: '#/components/schemas/AdapterConfig' },
                    rules: { $ref: '#/components/schemas/MatchingRules' },
                    status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateJobRequest: {
                type: 'object',
                required: ['name', 'source', 'target', 'rules'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    source: { $ref: '#/components/schemas/AdapterConfig' },
                    target: { $ref: '#/components/schemas/AdapterConfig' },
                    rules: { $ref: '#/components/schemas/MatchingRules' },
                },
            },
            AdapterConfig: {
                type: 'object',
                required: ['adapter'],
                properties: {
                    adapter: { type: 'string', enum: ['stripe', 'shopify', 'quickbooks', 'paypal'] },
                    config: { type: 'object' },
                },
            },
            MatchingRules: {
                type: 'object',
                properties: {
                    matching: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: { type: 'string' },
                                type: { type: 'string', enum: ['exact', 'fuzzy', 'range'] },
                                tolerance: { type: 'number' },
                            },
                        },
                    },
                },
            },
            Report: {
                type: 'object',
                properties: {
                    jobId: { type: 'string', format: 'uuid' },
                    summary: {
                        type: 'object',
                        properties: {
                            matched: { type: 'integer' },
                            unmatched_source: { type: 'integer' },
                            unmatched_target: { type: 'integer' },
                            accuracy: { type: 'number' },
                        },
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Pagination: {
                type: 'object',
                properties: {
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                    total: { type: 'integer' },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    traceId: { type: 'string' },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                    },
                },
            },
            Unauthorized: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                    },
                },
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                    },
                },
            },
            InternalServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                    },
                },
            },
        },
    },
};
// Serve OpenAPI spec
router.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
});
// Serve Swagger UI (if enabled)
if (config_1.config.features.enableApiDocs) {
    router.get('/docs', (_req, res) => {
        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Settler API Documentation</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js"></script>
          <script>
            SwaggerUIBundle({
              url: '/api/v1/openapi.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
              ]
            });
          </script>
        </body>
      </html>
    `);
    });
}
//# sourceMappingURL=openapi.js.map