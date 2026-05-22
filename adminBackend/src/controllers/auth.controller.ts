import { type Request, type Response } from "express";
import { authService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;
    const token = await authService.register(name, email);
    return new ApiResponse(200, "OTP sent to your email", { token }).send(res);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const token = await authService.login(email);
    return new ApiResponse(200, "OTP sent to your email", { token }).send(res);
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const newToken = await authService.resendOtp(token);
    return new ApiResponse(200, "OTP resent successfully", { token: newToken }).send(res);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { token, otp } = req.body;
    const result = await authService.verifyOtp(token, otp);
    return new ApiResponse(200, "OTP verified successfully", result).send(res);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const accessToken = await authService.refreshToken(refreshToken);
    return new ApiResponse(200, "Token refreshed successfully", { accessToken }).send(res);
});
