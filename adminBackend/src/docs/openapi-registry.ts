import { z } from "zod";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Initialize Zod with OpenAPI support
extendZodWithOpenApi(z);




export const registry = new OpenAPIRegistry();

// --- API Commons ---

export const ApiResponseSchema = registry.register("ApiResponse", z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
}));

export const PaginationParamsSchema = registry.register("PaginationParams", z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
}));

export const PaginatedResultSchema = registry.register("PaginatedResult", z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
}));

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
