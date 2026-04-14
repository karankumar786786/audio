import { type Request, type Response } from "express";
import { songService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import type { SongSchema } from "../schema/songs.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const createSong = asyncHandler(async (req: Request, res: Response) => {
    const result: { id: string, jobId: string, status: string } = await songService.createSong(req.body);
    return res.status(202).json(new ApiResponse(202, "Song processing initiated", result));
});

export const updateSong = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const song: SongSchema = await songService.updateSong(id, req.body);
    return res.status(200).json(new ApiResponse(200, "Song updated", song));
});

export const deleteSong = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const song: SongSchema = await songService.deleteSong(id);
    return res.status(200).json(new ApiResponse(200, "Song deleted", song));
});

export const getSongs = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<SongSchema> = await songService.getSongs(params);
    return res.status(200).json(new ApiResponse(200, "Songs fetched", result));
});

