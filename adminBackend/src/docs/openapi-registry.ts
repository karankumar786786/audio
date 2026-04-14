import { z } from "zod";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Initialize Zod with OpenAPI support
extendZodWithOpenApi(z);




export const registry = new OpenAPIRegistry();

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Admin Backend API",
      description: "Comprehensive API documentation for the Music Admin Backend.",
    },
    servers: [{ url: `http://localhost:${process.env.PORT}/api/v1` }],
  });
}
