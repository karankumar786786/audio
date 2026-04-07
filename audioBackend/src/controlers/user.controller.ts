import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import type {UserSchema } from "../schema/user.schema";
import { randomUUIDv7 } from "bun";

/**
 * User Controller
 * Handles user-related business logic.
 */
export const registerUser = (req: Request, res: Response) => {
  /**
   * The req.body is already validated by the `validate` middleware
   * at this point, so we can cast it to the UserInput type safely.
   */
  const {username,email} = req.body as UserSchema;

  // In a real app, you would save this user to a database here.
  const newUser = {
    id: randomUUIDv7("base64"),
    username,
    email,
    createdAt: new Date()
  };

  /**
   * Send a success response using the ApiResponse utility.
   * This ensures a consistent response shape.
   */
  return new ApiResponse(201, "User registered successfully", newUser).send(res);
};
