import { Router, Request, Response, NextFunction } from "express";
import { config } from "../config";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

extendZodWithOpenApi(z);

const router: Router = Router();

// Create the registry
export const registry = new OpenAPIRegistry();

// Register Security Schemes
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token obtained from /api/v1/auth/login",
});

registry.registerComponent("securitySchemes", "apiKey", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description: "API key for authentication",
});

// A basic health check route registration to ensure the spec works
registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check",
  description: "Basic health check endpoint",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "healthy" }),
            timestamp: z.string().datetime(),
            service: z.string().openapi({ example: "settler-api" }),
            version: z.string().openapi({ example: "1.0.0" }),
          }),
        },
      },
    },
  },
});

function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Settler API",
      version: "1.0.0",
      description:
        "Open Source Reconciliation Engine API - Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems",
      contact: {
        name: "Settler Support",
        email: "support@settler.io",
        url: "https://settler.io",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      { url: "https://api.settler.io", description: "Production" },
      { url: "https://api-staging.settler.io", description: "Staging" },
      { url: "http://localhost:3000", description: "Local Development" },
    ],
  });
}

// Serve OpenAPI spec as JSON
router.get("/openapi.json", (_req: Request, res: Response) => {
  res.json(generateOpenApiSpec());
});

// Serve Swagger UI
if (config.features.enableApiDocs) {
  router.use("/docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
    swaggerUi.setup(generateOpenApiSpec())(req, res, next);
  });
}

export { router as openApiRouter };
