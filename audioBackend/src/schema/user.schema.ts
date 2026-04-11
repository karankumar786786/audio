import { z } from "zod";

// The user id comes from Auth0 in production (e.g. "auth0|abc123")
export const userSchema = z.object({
    id: z.string().min(1, { message: "id is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    createdAt: z.string().datetime().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
    id: z.string().min(1, { message: "id is required" }),
    email: z.string().email({ message: "Valid email is required" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
