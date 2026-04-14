import type { Request, Response, NextFunction } from "express";
import { asyncLocalStorage } from "../observablity/trace";
import crypto from "crypto";

export const traceMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string) || crypto.randomUUID();
    
    // Set the traceId in the response headers for traceability by the client
    res.setHeader("x-trace-id", traceId);

    asyncLocalStorage.run({ traceId }, () => {
        next();
    });
};
