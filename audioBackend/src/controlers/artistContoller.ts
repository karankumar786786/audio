import { type Request, type Response, type NextFunction } from "express";
import { artistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../type/pagination.type";

export async function getArtists(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await artistService.getArtists(params);
        return res.status(200).json(new ApiResponse(200, "Artists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getArtistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const artist = await artistService.getArtistById(id);
        return res.status(200).json(new ApiResponse(200, "Artist fetched", artist));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongsOfArtist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const params = parsePagination(req.query);
        const result = await artistService.getArtistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of artist fetched", result));
    } catch (error: any) {
        next(error);
    }
}
