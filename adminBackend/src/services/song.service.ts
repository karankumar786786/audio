import type { Inngest } from "inngest";
import type { RecommendationService } from "../lib/recommendation";
import type { SearchRecord, SearchService } from "../lib/search";

import type { SignatureService } from "../lib/signature";
import { logMethods, type Logger } from "../observablity";
import type { SongProcessingJobRepository, SongRepository } from "../repository";
import type { CreateSongInput, SongSchema, UpdateSongInput } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../types/pagination.type";
import { buildPaginatedResult } from "../types/pagination.type";
import type { StorageService } from "../lib/storage";
import type ImageKit from "imagekit";
import path from "path";

export class SongService {
    private readonly ytDlpPath: string;

    constructor(
        private readonly songRepository: SongRepository,
        private readonly songProcessingJobRepository: SongProcessingJobRepository,
        private readonly signatureService: SignatureService,
        private readonly searchService: SearchService,
        private readonly recommendationService: RecommendationService,
        private readonly storageService: StorageService,
        private readonly imageKitClient: ImageKit,
        private readonly logger: Logger,
        private readonly inngest: Inngest,
    ) {
        logMethods(this, this.logger);
        this.ytDlpPath = path.resolve(process.cwd(), "bin/yt-dlp");
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
        this.logger.info({ ytUrl: data.ytUrl }, "createSongFromYoutube starting (async via Inngest)");

        const jobId: string = this.signatureService.generateSignedId();
        const songId: string = this.signatureService.generateSignedId();

        this.logger.info({ jobId, title: data.title }, "initializing processing job for YouTube import");
        
        await this.songProcessingJobRepository.create({
            id: songId,
            jobId: jobId,
            title: data.title,
            artistName: data.artistName,
            tempSongKey: "", // Will be filled by Inngest
            imageKey: "",    // Will be filled by Inngest
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
        
        // 1. Delete from main repository
        const song: SongSchema = await this.songRepository.delete(id);
        this.logger.info({ id }, "song deleted from repository");

        // 2. Best-effort cleanup of associated records and assets
        
        // 2.1 Delete from search index
        try {
            await this.searchService.delete(id);
            this.logger.info({ id }, "song deleted from search index");
        } catch (err) {
            this.logger.error({ err, id }, "failed to delete song from search index");
        }

        // 2.2 Delete from recommendation engine
        try {
            await this.recommendationService.delete(id);
            this.logger.info({ id }, "song deleted from recommendation engine");
        } catch (err) {
            this.logger.error({ err, id }, "failed to delete song from recommendation engine");
        }

        // 2.3 Delete processing job record
        try {
            await this.songProcessingJobRepository.delete(id);
            this.logger.info({ id }, "song processing job deleted");
        } catch (err) {
            this.logger.warn({ err, id }, "failed to delete song processing job (might not exist)");
        }

        // 2.4 Delete Image from ImageKit
        if (song.imageKey) {
            this.deleteImageFromIK(song.imageKey);
        }

        // 2.5 Delete Audio assets from S3
        if (song.songKey) {
            // Delete the HLS folder (the songKey is typically the manifest path)
            const hlsFolder = path.dirname(song.songKey);
            this.storageService.deleteFolder(process.env.BUCKET_NAME!, hlsFolder)
                .catch(err => this.logger.error({ err, hlsFolder }, "failed to cleanup HLS folder in S3"));
            
            // Delete the raw file if it's different or exists
            // Assuming songKey is under an HLS folder, we might need more logic or just trust deleteFolder
        }

        return song;
    }

    private async deleteImageFromIK(filePath: string): Promise<void> {
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
        this.logger.debug({ id }, "getJobStatus starting");
        this.signatureService.verifyId(id, "songId");
        return await this.songProcessingJobRepository.getById(id);
    }
}
