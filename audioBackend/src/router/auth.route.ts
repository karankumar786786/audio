import { Router } from "express";
import { z } from "zod";
import { authController } from "../infra";
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

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
authRouter.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
authRouter.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);
