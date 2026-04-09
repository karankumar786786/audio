import { type Request, type Response, type NextFunction } from "express";
import { songService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

/**
 * Controller for song-related operations.
 * Delegates business logic to SongService.
 */

export async function createSong(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await songService.createSong(req.body);
        return res.status(202).json(new ApiResponse(202, "Song processing initiated successfully", result));
    } catch (error: any) {
        next(error);
    }
}

export async function updateSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songService.updateSong(id, req.body);
        return res.status(200).json(new ApiResponse(200, "Song updated successfully", song));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songService.deleteSong(id);
        return res.status(200).json(new ApiResponse(200, "Song deleted successfully", song));
    } catch (error: any) {
        next(error);
    }
}

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

export async function searchSongs(req: Request, res: Response, next: NextFunction) {
    // Note: Search currently uses internalSearchService which groups results.
    // This specific endpoint might be redundant now that we have a unified search,
    // but keeping it for compatibility if needed.
    try {
        const query = req.query.q as string || "";
        // For individual song search we might just want to return the songs array from unified search
        // or let the unified search handle it.
        next(); // Or implement filtered song-only search if required.
    } catch (error: any) {
        next(error);
    }
}
