import type { SongRepository } from "../repository/song.repository.ts";
import type { SongProcessingJobRepository } from "../repository/song-processing-job.repository.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import type { SearchService, SearchRecord } from "../infra/search.types.ts";
import type { RecommendationService, RecommendationSchema } from "../infra/recommendation.types.ts";
import type { StorageService } from "../infra/storage.types.ts";
import { type CreateSongInput, type SongSchema, type UpdateSongInput } from "../schema/songs.schema.ts";
import { type PaginationParams, type PaginatedResult, buildPaginatedResult } from "../types/pagination.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import * as path from "node:path";

export class SongService {
    private readonly ytDlpPath: string;

    constructor(
        private readonly songRepository: SongRepository,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger,
        private readonly songProcessingJobRepository?: SongProcessingJobRepository,
        private readonly searchService?: SearchService<SearchRecord>,
        private readonly recommendationService?: RecommendationService<RecommendationSchema>,
        private readonly storageService?: StorageService,
        private readonly imageKitClient?: any,
        private readonly inngest?: any,
    ) {
        logMethods(this, this.logger);
        this.ytDlpPath = path.resolve(process.cwd(), "bin/yt-dlp");
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

    async getSongById(id: string): Promise<SongSchema> {
        this.signatureService.verifyId(id, "songId");
        return await this.songRepository.getById(id);
    }

    // ── Admin operations (only available if optional deps are injected) ─────────

    async createSong(input: CreateSongInput): Promise<{ id: string, jobId: string, status: string }> {
        if (!this.songProcessingJobRepository || !this.inngest) {
            throw new Error("Missing dependencies for createSong (Inngest or Job Repository not configured)");
        }
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
            status: "pending",
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

    async createSongFromYoutube(data: { ytUrl: string, title: string, artistName: string }): Promise<{ id: string, jobId: string, status: string }> {
        if (!this.songProcessingJobRepository || !this.inngest) {
            throw new Error("Missing dependencies for createSongFromYoutube (Inngest or Job Repository not configured)");
        }
        this.logger.info({ ytUrl: data.ytUrl }, "createSongFromYoutube starting (async via Inngest)");

        const jobId: string = this.signatureService.generateSignedId();
        const songId: string = this.signatureService.generateSignedId();

        this.logger.info({ jobId, title: data.title }, "initializing processing job for YouTube import");
        
        await this.songProcessingJobRepository.create({
            id: songId,
            jobId: jobId,
            title: data.title,
            artistName: data.artistName,
            tempSongKey: "",
            imageKey: "",
            savedInSearch: false,
            savedInRecommendation: false,
            transcoded: false,
            transcribed: false,
            extractedFeatures: false,
            status: "importing" as any,
        });

        await this.inngest.send({
            name: "audio/song.import-from-youtube",
            data: {
                songId,
                jobId,
                ytUrl: data.ytUrl,
                title: data.title,
                artistName: data.artistName,
            }
        });

        this.logger.info({ jobId }, "dispatched inngest event for YouTube import");

        return {
            id: songId,
            jobId: jobId,
            status: "pending"
        };
    }

    async updateSong(id: string, data: UpdateSongInput): Promise<SongSchema> {
        this.logger.debug({ id, data }, "updateSong starting");
        this.signatureService.verifyId(id, "songId");
        const song: SongSchema = await this.songRepository.update(id, data);
        this.logger.info({ id }, "song updated in repository");
        
        if (this.searchService) {
            try {
                await this.searchService.save(song as SearchRecord);
                this.logger.info({ id }, "song updated in search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to update search index for song");
            }
        }
        return song;
    }

    async deleteSong(id: string): Promise<SongSchema> {
        this.logger.debug({ id }, "deleteSong starting");
        this.signatureService.verifyId(id, "songId");
        
        const song: SongSchema = await this.songRepository.delete(id);
        this.logger.info({ id }, "song deleted from repository");

        if (this.searchService) {
            try {
                await this.searchService.delete(id);
                this.logger.info({ id }, "song deleted from search index");
            } catch (err) {
                this.logger.error({ err, id }, "failed to delete song from search index");
            }
        }

        if (this.recommendationService) {
            try {
                await this.recommendationService.delete(id);
                this.logger.info({ id }, "song deleted from recommendation engine");
            } catch (err) {
                this.logger.error({ err, id }, "failed to delete song from recommendation engine");
            }
        }

        if (this.songProcessingJobRepository) {
            try {
                await this.songProcessingJobRepository.delete(id);
                this.logger.info({ id }, "song processing job deleted");
            } catch (err) {
                this.logger.warn({ err, id }, "failed to delete song processing job (might not exist)");
            }
        }

        if (song.imageKey && this.imageKitClient) {
            this.deleteImageFromIK(song.imageKey);
        }

        if (song.songKey && this.storageService) {
            const hlsFolder = path.dirname(song.songKey);
            this.storageService.deleteFolder(process.env.BUCKET_NAME || "", hlsFolder)
                .catch(err => this.logger.error({ err, hlsFolder }, "failed to cleanup HLS folder in S3"));
        }

        return song;
    }

    private async deleteImageFromIK(filePath: string): Promise<void> {
        if (!this.imageKitClient) return;
        try {
            const result = await this.imageKitClient.listFiles({
                path: path.dirname(filePath),
                name: path.basename(filePath),
            });

            if (result && result.length > 0) {
                const file = result[0] as any;
                if (file.fileId) {
                    await this.imageKitClient.deleteFile(file.fileId);
                    this.logger.info({ filePath, fileId: file.fileId }, "image deleted from ImageKit");
                }
            }
        } catch (error) {
            this.logger.error({ error, filePath }, "failed to cleanup image from ImageKit");
        }
    }

    async getJobStatus(id: string): Promise<any> {
        if (!this.songProcessingJobRepository) {
            throw new Error("Missing dependency for getJobStatus (Job Repository not configured)");
        }
        this.logger.debug({ id }, "getJobStatus starting");
        this.signatureService.verifyId(id, "songId");
        return await this.songProcessingJobRepository.getById(id);
    }
}
