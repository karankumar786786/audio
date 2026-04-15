import type { NextFunction, Request, Response } from "express";
import { jwtServices } from "../infra";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const secure = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token && req.cookies) {
        token = req.cookies.token;
    }
    if (!token) {
        throw new ApiError(401, "Authorization token is missing or invalid");
    }
    try {
        const decoded = await jwtServices.verify(token);
        (req as any).user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});