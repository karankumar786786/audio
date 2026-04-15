import { type Logger } from "../observablity";
import { type SongProcessingJobRepository, type SongRepository } from "../repository";
import { type Database } from "../infra";
import { NotFoundError } from "../errors";
import { type SongProcessingJob } from "../schema/songProcessingJob.schema";
import { type SignatureUtility } from "../lib/signature";
import * as path from "node:path";
import * as fs from "node:fs";

export class AudioProcessingService {
    constructor(
        private readonly songRepository: SongRepository,
        private readonly jobRepository: SongProcessingJobRepository,
        private readonly transcodingService: any, // AudioTranscoder
        private readonly transcriptionService: any, // TranscriptionService (lib)
        private readonly searchService: any, // AlgoliaService
        private readonly recommendationService: any, // RecommendationServiceImpl
        private readonly storageService: any, // S3Service
        private readonly signatureUtility: SignatureUtility,
        private readonly logger: Logger
    ) {}

    async getJob(id: string): Promise<SongProcessingJob> {
        this.signatureUtility.verifyId(id);
        return this.jobRepository.getById(id);
    }

    async updateJobStatus(id: string, status: string): Promise<SongProcessingJob> {
        this.signatureUtility.verifyId(id);
        this.logger.info({ id, status }, "Updating job status");
        return this.jobRepository.update(id, { status: status as any });
    }

    async transcode(songId: string, jobId: string, stepLogger: Logger): Promise<{ audioName: string }> {
        this.signatureUtility.verifyId(songId);
        const job = await this.jobRepository.getById(songId);
        const tempBucket = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
        
        const baseTmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(baseTmpDir)) {
            fs.mkdirSync(baseTmpDir, { recursive: true });
        }
        
        const localDownloadPath = path.join(baseTmpDir, `${path.basename(songId)}`);
        const outputDir = path.join(baseTmpDir, `t_${songId}`);
        const audioName = path.basename(outputDir);

        try {
            stepLogger.info({ jobId, songId }, "Downloading raw audio for transcoding");
            await this.storageService.downloadObject(tempBucket, job.tempSongKey, localDownloadPath);
            stepLogger.info({ jobId, songId }, "Starting transcoding process");
            await this.transcodingService.transcode(localDownloadPath, outputDir);

            await this.jobRepository.update(songId, { 
                transcodingAttempt: 1,
                transcodingId: audioName,
                transcoded: true,
                status: "processing"
            });
            return { audioName };
        } finally {
            if (fs.existsSync(localDownloadPath)) fs.unlinkSync(localDownloadPath);
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        }
    }

    async transcribe(songId: string, jobId: string, audioName: string, stepLogger: Logger): Promise<{ language: string }> {
        this.signatureUtility.verifyId(songId);
        const job = await this.jobRepository.getById(songId);
        const tempBucket = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
        const prodBucket = process.env.PRODUCTION_BUCKET_NAME || "videotranscodeprod";
        
        const baseTmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(baseTmpDir)) {
            fs.mkdirSync(baseTmpDir, { recursive: true });
        }
        
        const localDownloadPath = path.join(baseTmpDir, `${path.basename(songId)}_transcribe`);
        const prodSongKey = `${process.env.BASE_PATH || "audios"}/${audioName}`;

        try {
            stepLogger.info({ jobId }, "Downloading audio for transcription");
            await this.storageService.downloadObject(tempBucket, job.tempSongKey, localDownloadPath);

            stepLogger.info({ jobId }, "Generating transcription");
            const captionPath = `${prodSongKey}/caption.json`;
            const result = await this.transcriptionService.generateTranscribe(
                localDownloadPath, 
                prodBucket, 
                captionPath
            );

            await this.jobRepository.update(songId, { 
                transcribingAttempt: 1,
                transcribingId: captionPath.replace('.json', '.vtt'),
                transcribed: true,
                language: result.language,
                songKey: prodSongKey
            });

            return { language: result.language };
        } finally {
            if (fs.existsSync(localDownloadPath)) {
                fs.unlinkSync(localDownloadPath);
            }
        }
    }

    async saveToSearch(songId: string, stepLogger: Logger): Promise<void> {
        this.signatureUtility.verifyId(songId);
        const job = await this.jobRepository.getById(songId);
        
        const searchRecord = {
            id: job.jobId,
            title: job.title,
            artistName: job.artistName,
            duration: job.duration || 0,
            songKey: job.songKey || "",
            imageKey: job.imageKey,
            language: job.language || "unknown",
        };

        stepLogger.info({ songId }, "Saving to Algolia");
        await this.searchService.save(searchRecord);

        await this.jobRepository.update(songId, { savedInSearch: true });
    }

    async finalize(songId: string, stepLogger: Logger): Promise<void> {
        this.signatureUtility.verifyId(songId);
        const job = await this.jobRepository.getById(songId);
        const tempBucket = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";

        stepLogger.info({ songId }, "Creating permanent library record for song");
        await this.songRepository.create({
            id: songId,
            jobId: job.jobId,
            title: job.title,
            artistName: job.artistName,
            duration: Math.floor((job.duration || 0) * 1000), // convert to ms as expected by DB
            songKey: job.songKey || "",
            imageKey: job.imageKey,
            language: job.language || "unknown",
        });

        stepLogger.info({ songId }, "Cleaning up temp bucket");
        try {
            await this.storageService.deleteObject(tempBucket, job.tempSongKey);
        } catch (err) {
            stepLogger.warn({ err, songId }, "Failed to delete temp object, continuing...");
        }

        await this.jobRepository.update(songId, { 
            status: "completed" 
        });
    }

    async saveToRecommendation(songId: string, stepLogger: Logger): Promise<void> {
        this.signatureUtility.verifyId(songId);
        const job = await this.jobRepository.getById(songId);
        
        stepLogger.info({ songId }, "Saving to Recombee");
        await this.recommendationService.saveSongToRecombee({
            id: job.id,
            title: job.title,
            artistName: job.artistName,
            duration: job.duration || 0,
            language: job.language || "unknown",
            bpm: job.bpm || 0,
        });

        await this.jobRepository.update(songId, { 
            savedInRecommendation: true,
            status: "completed"
        });
    }

    async extractFeatures(songId: string, features: any, stepLogger: Logger): Promise<void> {
        this.signatureUtility.verifyId(songId);
        stepLogger.info({ songId }, "Updating job with extracted features");
        await this.jobRepository.update(songId, {
            ...features,
            extractedFeatures: true
        });
    }
}
