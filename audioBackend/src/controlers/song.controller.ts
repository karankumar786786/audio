import { type Request, type Response, type NextFunction } from "express";
import {
    signatureService,
    logger,
    songProcessingJobRepository,
    songRepository,
    searchService,
    recommendationService,
    inngest
} from "../infra";
import type { CreateSongInput } from "../schema/songs.schema";
import { ApiResponse } from "../utils/ApiResponse";

// create song
export async function createSong(req: Request, res: Response, next: NextFunction) {
    const input: CreateSongInput = req.body;
    const jobId = signatureService.generateSignedId();
    const songId = signatureService.generateSignedId();
    try {
        logger.info(`[CONTROLLER] Initializing Processing Job ${jobId} for song: ${input.title}`);
        await songProcessingJobRepository.create({
            id: songId,
            jobId: jobId,
            title: input.title,
            artistName: input.artistName,
            tempSongKey: input.tempSongKey,
            imageKey: input.imageKey,
            savedInSearch: false,
            savedInRecommendation: false,
            transcoded: false,
            transcribed: false,
            extractedFeatures: false,
        });
        await inngest.send({
            name: "audio/song.transcode",
            data: {
                songId,
                jobId,
            }
        });
        logger.info(`[CONTROLLER] Dispatched Inngest event for Job ${jobId}`);
        return res.status(202).json(new ApiResponse(202, "Song processing initiated successfully", {
            id: songId,
            jobId: jobId,
            status: "pending"
        }));
    } catch (error: any) {
        logger.error(`[CONTROLLER] Failed to initiate job ${jobId}:`, error);
        next(error);
    }
}

// update song
export async function updateSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songRepository.update(id, req.body);
        return res.status(200).json(new ApiResponse(200, "Song updated successfully", song));
    } catch (error: any) {
        next(error);
    }
}

// delete song (also removes from search + recommendation)
export async function deleteSong(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songRepository.delete(id);

        // Best-effort cleanup from external services
        try { await searchService.delete(id); } catch (_) {}
        try { await recommendationService.delete(id); } catch (_) {}

        return res.status(200).json(new ApiResponse(200, "Song deleted successfully", song));
    } catch (error: any) {
        next(error);
    }
}

// get all songs
export async function getSongs(_req: Request, res: Response, next: NextFunction) {
    try {
        const songs = await songRepository.getAll();
        return res.status(200).json(new ApiResponse(200, "Songs fetched successfully", songs));
    } catch (error: any) {
        next(error);
    }
}

// get song by id
export async function getSongById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const song = await songRepository.getById(id);
        return res.status(200).json(new ApiResponse(200, "Song fetched successfully", song));
    } catch (error: any) {
        next(error);
    }
}

// search songs via Algolia
export async function searchSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const query = req.query.q as string || "";
        const results = await searchService.search(query);
        return res.status(200).json(new ApiResponse(200, "Search results", results));
    } catch (error: any) {
        next(error);
    }
}
