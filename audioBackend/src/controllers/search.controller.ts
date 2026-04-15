import { type Request, type Response } from "express";
import { type SearchService } from "../services/search.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";

export class SearchController {
    constructor(
        private readonly searchService: SearchService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    unifiedSearch = asyncHandler(async (req: Request, res: Response) => {
        const query:string = req.query.query as string || "";
        const result = await this.searchService.unifiedSearch(query);
        return res.status(200).json(new ApiResponse(200, "Search results fetched", result));
    });
}
