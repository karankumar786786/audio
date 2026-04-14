import type { Inngest } from "inngest";
import type { RecommendationService } from "../lib/recommendation";
import type { SearchService } from "../lib/search";
import type { SignatureService } from "../lib/signature";
import type { Logger } from "../observablity";
import type { SongProcessingJobRepository, SongRepository } from "../repository";
import type { CreateSongInput, SongSchema, UpdateSongInput } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class SongService {
    songRepository:SongRepository;
    songProcessingJobRepository:SongProcessingJobRepository;
    signatureService:SignatureService;
    searchService:SearchService;
    recommendationService:RecommendationService;
    logger:Logger;
    inngest:Inngest;
    constructor(
        songRepository:SongRepository,
        songProcessingJobRepository:SongProcessingJobRepository,
        singnatureService:SignatureService,
        searchService:SearchService,
        recommendationService:RecommendationService,
        logger:Logger,
        inngest:Inngest,
    ) {
        this.songRepository = songRepository;
        this.songProcessingJobRepository = songProcessingJobRepository;
        this.signatureService = singnatureService;
        this.searchService = searchService;
        this.recommendationService = recommendationService;
        this.logger = logger;
        this.inngest = inngest;
    }
    async createSong(input: CreateSongInput): Promise<{ id: string, jobId: string, status: string }> {
        const jobId:string = this.signatureService.generateSignedId();
        const songId:string = this.signatureService.generateSignedId();
        this.logger.info(`[SERVICE] Initializing Processing Job ${jobId} for song: ${input.title}`);
        await this.songProcessingJobRepository.create({
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
        await this.inngest.send({
            name: "audio/song.transcode",
            data: {
                songId,
                jobId,
            }
        });
        this.logger.info(`[SERVICE] Dispatched Inngest event for Job ${jobId}`);
        return {
            id: songId,
            jobId: jobId,
            status: "pending"
        };
    }
    async getSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset:number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.songRepository.getAll(params.limit, offset),
            this.songRepository.count()
        ]);
        return buildPaginatedResult<SongSchema>(data, total, params);
    }

    async updateSong(id: string, data: UpdateSongInput): Promise<SongSchema> {
        // Best effort update in search index if title/artist changes
        const song:SongSchema = await this.songRepository.update(id, data);
        try {
            await this.searchService.save(song as any);
        } catch (err) {
            this.logger.error(`[SERVICE] Failed to update search index for song ${id}:`, err);
        }
        return song;
    }
    async deleteSong(id: string): Promise<SongSchema> {
        const song:SongSchema = await this.songRepository.delete(id);
        try { await this.searchService.delete(id); } catch (err) {
            this.logger.error(`[SERVICE] Failed to delete song ${id} from search index:`, err);
        }
        try { await this.recommendationService.delete(id); } catch (err) {
            this.logger.error(`[SERVICE] Failed to delete song ${id} from recommendation engine:`, err);
        }
        return song;
    }
}
