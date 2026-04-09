import { type Request, type Response, type NextFunction } from "express";
import { internalSearchService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// unified search across songs, artists, and playlists — delegated to service
export async function search(req: Request, res: Response, next: NextFunction) {
    try {
        const query = req.query.q as string || "";
        const results = await internalSearchService.unifiedSearch(query);
        return res.status(200).json(new ApiResponse(200, "Search results", results));
    } catch (error: any) {
        next(error);
    }
}
