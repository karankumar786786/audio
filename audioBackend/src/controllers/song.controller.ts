import { type Request, type Response, type NextFunction } from "express";
import { songService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

/**
 * Controller for song-related operations.
 * Delegates business logic to SongService.
 */


export async function getSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await songService.getSongs(params);
        return res.status(200).json(new ApiResponse(200, "Songs fetched successfully", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songService.getSongById(id);
        return res.status(200).json(new ApiResponse(200, "Song fetched successfully", song));
    } catch (error: any) {
        next(error);
    }
}
