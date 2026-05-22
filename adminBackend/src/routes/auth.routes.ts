import { Router } from "express";
import { z } from "zod";
import { register, login, resendOtp, verifyOtp, refreshToken } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";

export const authRouter = Router();

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required")
});

const loginSchema = z.object({
    email: z.string().email("Valid email is required")
});

const resendOtpSchema = z.object({
    token: z.string().min(1, "Session token is required")
});

const verifyOtpSchema = z.object({
    token: z.string().min(1, "Session token is required"),
    otp: z.string().length(6, "OTP must be exactly 6 digits")
});

const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
});

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/resend-otp", validate(resendOtpSchema), resendOtp);
authRouter.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
authRouter.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
