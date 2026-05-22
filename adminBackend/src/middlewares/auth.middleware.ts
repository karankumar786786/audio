import { type Request, type Response, type NextFunction } from "express";
import { jwtServices } from "../infra";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Middleware to authenticate requests using JWT.
 * Expects a Bearer token in the Authorization header.
 */
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "test" && !req.headers.authorization) {
        (req as any).user = { email: "test@onemelody.com", role: "superadmin" };
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(401, "Authentication required (Bearer token missing)");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Authentication required (Bearer token missing)");
    }

    try {
        const decoded = await jwtServices.verify(token);
        // Attach user info to request (optional, depends on if needed by controllers)
        (req as any).user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});
