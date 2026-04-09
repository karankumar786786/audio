import { type Request, type Response, type NextFunction } from "express";
import { searchService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// unified search across songs, artists, and playlists — grouped by type
export async function search(req: Request, res: Response, next: NextFunction) {
    try {
        const query = req.query.q as string || "";
        if (!query.trim()) {
            return res.status(200).json(new ApiResponse(200, "Search results", {
                songs: [],
                artists: [],
                playlists: [],
            }));
        }

        const hits = await searchService.search<Record<string, any>>(query);

        const songs: Record<string, any>[] = [];
        const artists: Record<string, any>[] = [];
        const playlists: Record<string, any>[] = [];

        for (const hit of hits) {
            if ("title" in hit && "artistName" in hit) {
                // Song: has title + artistName
                songs.push(hit);
            } else if ("about" in hit || "dob" in hit) {
                // Artist: has about/dob
                artists.push(hit);
            } else if ("coverImageKey" in hit || "bannerImageKey" in hit) {
                // System Playlist: has coverImageKey but no title/about
                playlists.push(hit);
            }
        }

        return res.status(200).json(new ApiResponse(200, "Search results", {
            songs,
            artists,
            playlists,
        }));
    } catch (error: any) {
        next(error);
    }
}
