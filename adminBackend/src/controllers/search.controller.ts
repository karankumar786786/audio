import { type Request, type Response } from "express";
import { searchService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import type { UnifiedSearchResponse } from "../services/search.service";

export const unifiedSearch = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const result: UnifiedSearchResponse = await searchService.unifiedSearch(query);
    return new ApiResponse<UnifiedSearchResponse>(200, "Search results fetched", result).send(res);
});
