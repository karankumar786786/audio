import { type Request, type Response, type NextFunction } from "express";
import { artistService, signatureService } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { parsePagination, type PaginatedResult, type PaginationParams } from "../types/pagination.type";
import { coerceDob } from "../schema/artist.schema";
import type {ArtistSchema, CreateArtistSchema} from "../schema/artist.schema";
import type { SongSchema } from "../schema/songs.schema";

export async function createArtist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        // Coerce dob to ISO datetime so Postgres TIMESTAMPTZ is happy
        const data:CreateArtistSchema = { ...req.body, dob: coerceDob(req.body.dob) };
        const artist:ArtistSchema = await artistService.createArtist(data);
        return res.status(201).json(new ApiResponse(201, "Artist created", artist));
    } catch (error: any) {
        next(error);
    }
}

export async function deleteArtist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id = req.params.id as string;
        signatureService.verifyId(id,"artistId");
        const artist:ArtistSchema = await artistService.deleteArtist(id);
        return res.status(200).json(new ApiResponse(200, "Artist deleted", artist));
    } catch (error: any) {
        next(error);
    }
}

export async function getArtists(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<ArtistSchema> = await artistService.getArtists(params);
        return res.status(200).json(new ApiResponse(200, "Artists fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function getArtistById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        signatureService.verifyId(id,"artistId");
        const artist:ArtistSchema = await artistService.getArtistById(id);
        return res.status(200).json(new ApiResponse(200, "Artist fetched", artist));
    } catch (error: any) {
        next(error);
    }
}

export async function getSongsOfArtist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        signatureService.verifyId(id,"artistId");
        const params:PaginationParams = parsePagination(req.query);
        const result:PaginatedResult<SongSchema> = await artistService.getArtistSongs(id, params);
        return res.status(200).json(new ApiResponse(200, "Songs of artist fetched", result));
    } catch (error: any) {
        next(error);
    }
}

export async function updateArtist(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const id:string = req.params.id as string;
        signatureService.verifyId(id,"artistId");
        const artist:ArtistSchema = await artistService.updateArtist(id, req.body);
        return res.status(200).json(new ApiResponse(200, "Artist updated", artist));
    } catch (error: any) {
        next(error);
    }
}
