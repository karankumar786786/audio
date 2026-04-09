import { type Request, type Response, type NextFunction } from "express";
import {
    artistRepository,
    signatureService,
    searchService,
    db,
} from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// create artist
export async function createArtist(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, about, dob, coverImageKey, bannerImageKey } = req.body;
        const id = signatureService.generateSignedId();
        const artist = await artistRepository.create({ id, name, about, dob, coverImageKey, bannerImageKey });

        // Index in Algolia for search
        try {
            await searchService.save({ id, name, about, dob, coverImageKey, bannerImageKey } as any);
        } catch (_) {}

        return res.status(201).json(new ApiResponse(201, "Artist created", artist));
    } catch (error: any) {
        next(error);
    }
}

// delete artist
export async function deleteArtist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const artist = await artistRepository.delete(id);

        try { await searchService.delete(id); } catch (_) {}

        return res.status(200).json(new ApiResponse(200, "Artist deleted", artist));
    } catch (error: any) {
        next(error);
    }
}

// get all artists
export async function getArtists(_req: Request, res: Response, next: NextFunction) {
    try {
        const artists = await artistRepository.getAll();
        return res.status(200).json(new ApiResponse(200, "Artists fetched", artists));
    } catch (error: any) {
        next(error);
    }
}

// get artist by id
export async function getArtistById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const artist = await artistRepository.getById(id);
        return res.status(200).json(new ApiResponse(200, "Artist fetched", artist));
    } catch (error: any) {
        next(error);
    }
}

// get songs of an artist
export async function getSongsOfArtist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        // First get the artist to verify they exist
        const artist = await artistRepository.getById(id);

        const songs = await db`
            SELECT 
                id, title, artist_name AS "artistName", duration,
                song_key AS "songKey", image_key AS "imageKey",
                language, job_id AS "jobId", created_at AS "createdAt"
            FROM songs
            WHERE artist_name = ${artist.name}
            ORDER BY created_at DESC
        `;
        return res.status(200).json(new ApiResponse(200, "Artist songs fetched", songs));
    } catch (error: any) {
        next(error);
    }
}

// update artist
export async function updateArtist(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const artist = await artistRepository.update(id, req.body);
        return res.status(200).json(new ApiResponse(200, "Artist updated", artist));
    } catch (error: any) {
        next(error);
    }
}
