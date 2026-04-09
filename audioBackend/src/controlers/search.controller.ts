import { type Request, type Response, type NextFunction } from "express";
import { searchService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// unified search across songs, artists, and playlists
export async function search(req: Request, res: Response, next: NextFunction) {
    try {
        const query = req.query.q as string || "";
        if (!query.trim()) {
            return res.status(200).json(new ApiResponse(200, "Search results", []));
        }
        const results = await searchService.search(query);
        return res.status(200).json(new ApiResponse(200, "Search results", results));
    } catch (error: any) {
        next(error);
    }
}
