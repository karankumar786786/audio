import { type Request, type Response } from "express";
import { type AuthService } from "@onemelody/core";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    register = asyncHandler(async (req: Request, res: Response) => {
        const { name, email } = req.body;
        const token = await this.authService.register(name, email);
        return new ApiResponse(200, "OTP sent to your email", { token }).send(res);
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        const token = await this.authService.login(email);
        return new ApiResponse(200, "OTP sent to your email", { token }).send(res);
    });

    resendOtp = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.body;
        const newToken = await this.authService.resendOtp(token);
        return new ApiResponse(200, "OTP resent successfully", { token: newToken }).send(res);
    });

    verifyOtp = asyncHandler(async (req: Request, res: Response) => {
        const { token, otp } = req.body;
        const result = await this.authService.verifyOtp(token, otp);
        return new ApiResponse(200, "OTP verified successfully", result).send(res);
    });

    refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const accessToken = await this.authService.refreshToken(refreshToken);
        return new ApiResponse(200, "Token refreshed successfully", { accessToken }).send(res);
    });
}
