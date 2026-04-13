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
  // ApiError — our own domain errors
  if (err instanceof ApiError) {
    new ApiResponse(err.statusCode, err.message, { errors: err.errors }, false).send(res);
    return;
  }

  // ZodError — schema validation bubbled to handler directly
  if (err instanceof ZodError) {
    const message = err.issues.map((e) => e.message).join(", ");
    new ApiResponse(400, message, { errors: err.issues }, false).send(res);
    return;
  }

  // Generic / unexpected errors
  const message =
    err instanceof Error ? err.message : "Internal Server Error";
  new ApiResponse(500, message, null, false).send(res);
};