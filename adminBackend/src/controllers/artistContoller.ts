import { type Request, type Response, type NextFunction } from "express";
import { artistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import { coerceDob } from "../schema/artist.schema";
import type {ArtistSchema, CreateArtistSchema} from "../schema/artist.schema";
import type { SongSchema } from "../schema/songs.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const createArtist = asyncHandler(async (req: Request, res: Response) => {
    // Coerce dob to ISO datetime so Postgres TIMESTAMPTZ is happy
    const data: CreateArtistSchema = { ...req.body, dob: coerceDob(req.body.dob) };
    const artist: ArtistSchema = await artistService.createArtist(data);
    return res.status(201).json(new ApiResponse(201, "Artist created", artist));
});

export const deleteArtist = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const artist = await artistService.deleteArtist(id);
    return res.status(200).json(new ApiResponse(200, "Artist deleted", artist));
});

export const getArtists = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<ArtistSchema> = await artistService.getArtists(params);
    return res.status(200).json(new ApiResponse(200, "Artists fetched", result));
});

export const getArtistById = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const artist: ArtistSchema = await artistService.getArtistById(id);
    return res.status(200).json(new ApiResponse(200, "Artist fetched", artist));
});

export const getSongsOfArtist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<SongSchema> = await artistService.getArtistSongs(id, params);
    return res.status(200).json(new ApiResponse(200, "Songs of artist fetched", result));
});

export const updateArtist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const artist = await artistService.updateArtist(id, req.body);
    return res.status(200).json(new ApiResponse(200, "Artist updated", artist));
});
