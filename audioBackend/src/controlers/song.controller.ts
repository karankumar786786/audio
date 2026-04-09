import { type Request, type Response, type NextFunction } from "express";
import {
    signatureService,
    logger,
    songProcessingJobRepository,
    inngest
} from "../infra";
import type { CreateSongInput } from "../schema/songs.schema";
import { ApiResponse } from "../utils/ApiResponse";

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
