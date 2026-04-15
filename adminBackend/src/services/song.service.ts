import type { Inngest } from "inngest";
import type { RecommendationService } from "../lib/recommendation";
import type { SearchRecord, SearchService } from "../lib/search";

import type { SignatureService } from "../lib/signature";
import { logMethods, type Logger } from "../observablity";
import type { SongProcessingJobRepository, SongRepository } from "../repository";
import type { CreateSongInput, SongSchema, UpdateSongInput } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";

export class SongService {

    constructor(
        private readonly songRepository: SongRepository,
        private readonly songProcessingJobRepository: SongProcessingJobRepository,
        private readonly signatureService: SignatureService,
        private readonly searchService: SearchService,
        private readonly recommendationService: RecommendationService,
        private readonly logger: Logger,
        private readonly inngest: Inngest,
    ) {
        logMethods(this, this.logger);
    }
    async createSong(input: CreateSongInput): Promise<{ id: string, jobId: string, status: string }> {
        this.logger.debug({ input }, "createSong starting");
        const jobId: string = this.signatureService.generateSignedId();
        const songId: string = this.signatureService.generateSignedId();
        this.logger.info({ jobId, title: input.title }, "initializing processing job for song");
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
        this.logger.info({ jobId }, "dispatched inngest event for processing job");
        return {
            id: songId,
            jobId: jobId,
            status: "pending"
        };
    }
    async getSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.logger.debug({ params }, "getSongs starting");
        const offset: number = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.songRepository.getAll(params.limit, offset),
            this.songRepository.count()
        ]);
        this.logger.debug({ total }, "getSongs successfully fetched");
        return buildPaginatedResult<SongSchema>(data, total, params);
    }

    async updateSong(id: string, data: UpdateSongInput): Promise<SongSchema> {
        this.logger.debug({ id, data }, "updateSong starting");
        // Best effort update in search index if title/artist changes
        this.signatureService.verifyId(id, "songId");
        const song: SongSchema = await this.songRepository.update(id, data);
        this.logger.info({ id }, "song updated in repository");
        try {
            await this.searchService.save(song as SearchRecord);
            this.logger.info({ id }, "song updated in search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to update search index for song");
        }
        return song;
    }
    async deleteSong(id: string): Promise<SongSchema> {
        this.logger.debug({ id }, "deleteSong starting");
        this.signatureService.verifyId(id, "songId");
        const song: SongSchema = await this.songRepository.delete(id);
        this.logger.info({ id }, "song deleted from repository");
        try {
            await this.searchService.delete(id);
            this.logger.info({ id }, "song deleted from search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to delete song from search index");
        }
        try {
            await this.recommendationService.delete(id);
            this.logger.info({ id }, "song deleted from recommendation engine");
        } catch (err) {
            this.logger.error({ err, id }, "failed to delete song from recommendation engine");
        }
        return song;
    }

    async getJobStatus(id: string): Promise<any> {
        this.logger.debug({ id }, "getJobStatus starting");
        this.signatureService.verifyId(id, "songId");
        return await this.songProcessingJobRepository.getById(id);
    }
}
