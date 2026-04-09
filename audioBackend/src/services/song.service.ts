import { 
    songRepository, 
    songProcessingJobRepository, 
    signatureService, 
    inngest,
    logger,
    searchService,
    recommendationService
} from "../infra";
import type { CreateSongInput, SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class SongService {
    async createSong(input: CreateSongInput) {
        const jobId = signatureService.generateSignedId();
        const songId = signatureService.generateSignedId();
        
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
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            songRepository.getAll(params.limit, offset),
            songRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }

    async getSongById(id: string): Promise<SongSchema> {
        return await songRepository.getById(id);
    }

    async updateSong(id: string, data: any): Promise<SongSchema> {
        return await songRepository.update(id, data);
    }

    async deleteSong(id: string): Promise<SongSchema> {
        const song = await songRepository.delete(id);

        // Best-effort cleanup from external services
        try { await searchService.delete(id); } catch (err) {
            logger.error(`[SERVICE] Failed to delete song ${id} from search index:`, err);
        }
        try { await recommendationService.delete(id); } catch (err) {
            logger.error(`[SERVICE] Failed to delete song ${id} from recommendation engine:`, err);
        }

        return song;
    }
}
