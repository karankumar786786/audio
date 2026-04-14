import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { ZodError } from "zod";
import { logger } from "../observablity";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ZodError — schema validation mismatch in request OR database response
  if (err instanceof ZodError) {
    const message = "Validation failed (Schema Mismatch)";
    const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
    
    logger.warn({ errors }, message);
    new ApiResponse(400, message, { errors }, false).send(res);
    return;
  }

  // ApiError — our own domain errors (NotFoundError, BadRequestError, etc.)
  if (err instanceof ApiError) {
    logger.warn({ statusCode: err.statusCode, message: err.message }, "API Error");
    new ApiResponse(err.statusCode, err.message, { errors: err.errors }, false).send(res);
    return;
  }

  // Generic / unexpected errors
  const message = err instanceof Error ? err.message : "Internal Server Error";
  logger.error({ error: err }, `Unexpected Error: ${message}`);
  new ApiResponse(500, message, null, false).send(res);
};