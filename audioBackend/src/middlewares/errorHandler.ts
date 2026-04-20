import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { ZodError } from "zod";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ZodError — schema validation mismatch in request OR database response
  if (err instanceof ZodError) {
    new ApiResponse(400, "Validation failed (Schema Mismatch)", { 
        errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) 
    }, false).send(res);
    return;
  }

  // ApiError — our own domain errors (NotFoundError, BadRequestError, etc.)
  if (err instanceof ApiError) {
    new ApiResponse(err.statusCode, err.message, { errors: err.errors }, false).send(res);
    return;
  }

  // Generic / unexpected errors
  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error("[Global Error Handler] 500 Error:", err);
  new ApiResponse(500, message, null, false).send(res);
};