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
import { spawn } from "child_process";
import path from "path";
import axios from "axios";

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

    private async getYoutubeMetadata(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const child = spawn(this.ytDlpPath, [url, "--dump-single-json", "--no-check-certificates", "--no-warnings"]);
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (data) => { stdout += data; });
            child.stderr.on("data", (data) => { stderr += data; });
            child.on("close", (code) => {
                if (code !== 0) return reject(new Error(`yt-dlp metadata failed with code ${code}`));
                try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error("Failed to parse metadata")); }
            });
        });
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

    async createSongFromYoutube(data: { ytUrl: string, title: string, artistName: string }): Promise<{ id: string, jobId: string, status: string }> {
        this.logger.info({ ytUrl: data.ytUrl }, "createSongFromYoutube starting");

        try {
            // 1. Get YouTube Metadata
            this.logger.debug("Fetching yt-dlp metadata");
            const metadata = await this.getYoutubeMetadata(data.ytUrl);
            const thumbnailUrl = metadata.thumbnail;
            this.logger.debug({ thumbnailUrl }, "YouTube metadata fetched");

            // 2. Start yt-dlp stream process
            this.logger.debug("Starting yt-dlp audio stream");
            const ytDlpProcess = spawn(this.ytDlpPath, [
                data.ytUrl,
                "-f", "bestaudio",
                "-o", "-",
                "--no-check-certificates",
                "--no-warnings"
            ]);

            // 3. Upload to S3 (TEMP_BUCKET_NAME) via stream
            const tempSongKey = `songs/raw/${this.signatureService.generateSignedId()}.webm`;
            this.logger.debug({ tempSongKey }, "piping yt-dlp stream to S3 temp bucket");
            
            // Note: S3 upload returns a promise but we pass the stdout stream
            await this.storageService.uploadObject(
                process.env.TEMP_BUCKET_NAME || "videotranscodetemp",
                tempSongKey,
                ytDlpProcess.stdout,
                "audio/webm" // Defaulting to webm as yt-dlp bestaudio usually returns webm or m4a
            );
            this.logger.debug("Audio stream uploaded successfully");

            // 4. Download and Upload Thumbnail to ImageKit
            let imageKey = "";
            if (thumbnailUrl) {
                this.logger.debug({ thumbnailUrl }, "fetching YouTube thumbnail via axios");
                const response = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
                const buffer = Buffer.from(response.data, "binary");
                
                this.logger.debug("Uploading thumbnail to ImageKit");
                const uploadRes = await this.imageKitClient.upload({
                    file: buffer,
                    fileName: `yt-thumb-${Date.now()}.jpg`,
                    folder: "/songs/images"
                });
                imageKey = uploadRes.filePath;
                this.logger.debug({ imageKey }, "Thumbnail uploaded successfully");
            }

            // 5. Delegate to existing createSong to trigger pipeline
            this.logger.debug("Finalizing song creation and triggering Inngest");
            return await this.createSong({
                title: data.title,
                artistName: data.artistName,
                tempSongKey: tempSongKey,
                imageKey: imageKey
            });

        } catch (error: any) {
            this.logger.error({ error: error.message, stack: error.stack }, `Failed to process YouTube upload for URL: ${data.ytUrl}`);
            throw error;
        }
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
