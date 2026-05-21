import { type Request, type Response } from "express";
import { artistService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams, coerceDob, type ArtistSchema, type CreateArtistSchema, type SongSchema } from "@onemelody/core";
import { asyncHandler } from "../utils/asyncHandler";

export const createArtist = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateArtistSchema = { ...req.body, dob: coerceDob(req.body.dob) };
    const artist: ArtistSchema = await artistService.createArtist(data);
    return new ApiResponse<ArtistSchema>(201, "Artist created", artist).send(res);
});

export const deleteArtist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const artist: ArtistSchema = await artistService.deleteArtist(id);
    return new ApiResponse<ArtistSchema>(200, "Artist deleted", artist).send(res);
});

export const getArtists = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<ArtistSchema> = await artistService.getArtists(params);
    return new ApiResponse<PaginatedResult<ArtistSchema>>(200, "Artists fetched", result).send(res);
});

export const getArtistById = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const artist: ArtistSchema = await artistService.getArtistById(id);
    return new ApiResponse<ArtistSchema>(200, "Artist fetched", artist).send(res);
});

export const getSongsOfArtist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const params: PaginationParams = parsePagination(req.query);
    const result: PaginatedResult<SongSchema> = await artistService.getArtistSongs(id, params);
    return new ApiResponse<PaginatedResult<SongSchema>>(200, "Songs of artist fetched", result).send(res);
});

export const updateArtist = asyncHandler(async (req: Request, res: Response) => {
    const id: string = req.params.id as string;
    const artist: ArtistSchema = await artistService.updateArtist(id, req.body);
    return new ApiResponse<ArtistSchema>(200, "Artist updated", artist).send(res);
});
