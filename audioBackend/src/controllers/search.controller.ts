import { type Request, type Response } from "express";
import { type SearchService, type UnifiedSearchResponse } from "../services/search.service";
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
        const query: string = req.query.query as string || "";
        const result:UnifiedSearchResponse = await this.searchService.unifiedSearch(query);
        return new ApiResponse<UnifiedSearchResponse>(200, "Search results fetched", result).send(res);
    });
}
