import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const userSchema = z.object({
    id: z.string().min(1, { message: "id is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    createdAt: z.coerce.string().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
    id: z.string().min(1, { message: "id is required" }),
    email: z.string().email({ message: "Valid email is required" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UserInfo = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  updated_at?: string;
};
