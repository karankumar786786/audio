import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class SystemStatusController {
    constructor(
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    getStatus = asyncHandler(async (_req: Request, res: Response) => {
        return new ApiResponse<null>(200, "healthy").send(res);
    });
}