import { z } from "zod";

// Temporary workaround for testing
// @ts-ignore
if (typeof z.string().openapi !== "function") {
  const ZodType = Object.getPrototypeOf(z.string());
  ZodType.openapi = function (_opts: any) {
    return this;
  };
}

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Register a basic health check endpoint to have at least one route in the spec
registry.registerPath({
  method: "get",
  path: "/health",
  description: "Check API health status",
  summary: "Health Check",
  tags: ["System"],
  responses: {
    200: {
      description: "API is healthy",
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

export const openApiRouter: import("express").Router = Router();

// Generate the OpenAPI document
const generateOpenApiDoc = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Settler API",
      description: "Reconciliation and financial operations API",
    },
    servers: [{ url: "/api/v1" }],
  });
};

const openApiDocument = generateOpenApiDoc();

// Serve Swagger UI
openApiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Serve the raw OpenAPI JSON
openApiRouter.get("/openapi.json", (req, res) => {
  res.json(openApiDocument);
});
