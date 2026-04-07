import { z } from "zod";

/**
 * User Schema for Validation
 * Defines the shape and constraints of the user input data.
 */
export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(20, "Username must be at most 20 characters long"),
  
  email: z.email("Invalid email format"),
});

// Infer the type from the schema for type safety across the app
export type UserSchema = z.infer<typeof userSchema>;
