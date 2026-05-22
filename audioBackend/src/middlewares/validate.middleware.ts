import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

export interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schema: ZodTypeAny | ValidationSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const isDirectZod = typeof (schema as any).safeParse === "function";
    const bodySchema = isDirectZod ? (schema as ZodTypeAny) : (schema as ValidationSchema).body;
    const querySchema = isDirectZod ? undefined : (schema as ValidationSchema).query;
    const paramsSchema = isDirectZod ? undefined : (schema as ValidationSchema).params;

    if (paramsSchema) {
      const result = paramsSchema.safeParse(req.params);
      if (!result.success) {
        const message = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        next(new ApiError(400, `Invalid path parameters: ${message}`, result.error.issues));
        return;
      }
      Object.defineProperty(req, "params", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    if (querySchema) {
      const result = querySchema.safeParse(req.query);
      if (!result.success) {
        const message = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        next(new ApiError(400, `Invalid query parameters: ${message}`, result.error.issues));
        return;
      }
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    if (bodySchema) {
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        const message = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        next(new ApiError(400, message, result.error.issues));
        return;
      }
      req.body = result.data;
    }

    next();
  };