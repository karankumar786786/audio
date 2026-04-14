import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();


// Common Schemas
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
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
}));
