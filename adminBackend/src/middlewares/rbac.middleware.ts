import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware to restrict route access to specific roles.
 */
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            return next(new ApiError(401, "Authentication required"));
        }
        if (!user.role || !allowedRoles.includes(user.role)) {
            return next(new ApiError(403, "Access denied: insufficient permissions"));
        }
        next();
    };
};
