import { Router } from "express";
import { registerUser } from "../controlers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { userSchema } from "../schema/user.schema";

/**
 * User Router
 * Defines user-related endpoints.
 */
export const userRouter = Router();

/**
 * Register User Route
 * 1. Validate: Use the `validate` middleware with `userSchema` to verify the body.
 * 2. Handle: If the data is valid, call the `registerUser` controller.
 */
userRouter.post("/register", validate(userSchema), registerUser);
