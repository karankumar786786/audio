import {
    songRepository,
    songProcessingJobRepository,
    signatureService,
    inngest,
    logger,
    searchService,
    recommendationService
} from "../infra";
import type { CreateSongInput, SongSchema, UpdateSongInput } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class SongService {
    /**
     *
     */
    constructor() {
    }
    async createSong(input: CreateSongInput): Promise<{ id: string, jobId: string, status: string }> {
        const jobId:string = signatureService.generateSignedId();
        const songId:string = signatureService.generateSignedId();
        logger.info(`[SERVICE] Initializing Processing Job ${jobId} for song: ${input.title}`);
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
        logger.info(`[SERVICE] Dispatched Inngest event for Job ${jobId}`);
        return {
            id: songId,
            jobId: jobId,
            status: "pending"
        };
    }
    async getSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            songRepository.getAll(params.limit, offset),
            songRepository.count()
        ]);
        return buildPaginatedResult<SongSchema>(data, total, params);
    }

    async updateSong(id: string, data: UpdateSongInput): Promise<SongSchema> {
        // Best effort update in search index if title/artist changes
        const song:SongSchema = await songRepository.update(id, data);
        try {
            await searchService.save(song as any);
        } catch (err) {
            logger.error(`[SERVICE] Failed to update search index for song ${id}:`, err);
        }
        return song;
    }
    async deleteSong(id: string): Promise<SongSchema> {
        const song:SongSchema = await songRepository.delete(id);
        try { await searchService.delete(id); } catch (err) {
            logger.error(`[SERVICE] Failed to delete song ${id} from search index:`, err);
        }
        try { await recommendationService.delete(id); } catch (err) {
            logger.error(`[SERVICE] Failed to delete song ${id} from recommendation engine:`, err);
        }
        return song;
    }
}
