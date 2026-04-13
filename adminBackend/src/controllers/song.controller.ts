import { type Request, type Response, type NextFunction } from "express";
import { songService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination } from "../types/pagination.type";

export async function createSong(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await songService.createSong(req.body);
        return res.status(202).json(new ApiResponse(202, "Song processing initiated", result));
    } catch (error: any) {
        next(error);
    }
}

export async function updateSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songService.updateSong(id, req.body);
        return res.status(200).json(new ApiResponse(200, "Song updated", song));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songService.deleteSong(id);
        return res.status(200).json(new ApiResponse(200, "Song deleted", song));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const params = parsePagination(req.query);
        const result = await songService.getSongs(params);
        return res.status(200).json(new ApiResponse(200, "Songs fetched", result));
    } catch (error: any) {
        next(error);
    }
}

