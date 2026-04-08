import { type Request, type Response, type NextFunction } from "express";
import * as path from "node:path";
import * as fs from "node:fs";
import axios from "axios";
import {
    storageService,
    transcodingService,
    recommendationService,
    searchService,
    signatureService,
    logger,
    transcriptionService,
    songRepository,
    songProcessingJobRepository
} from "../infra";
import type { CreateSongInput } from "../schema/songs.schema";
import { ApiResponse } from "../utils/ApiResponse";

const TEMP_BUCKET = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
const PROD_BUCKET = process.env.PRODUCTION_BUCKET_NAME || "videotranscodeprod";
const FEATURE_API_URL = process.env.FEATURE_API_URL || "http://localhost:8000";

interface AudioFeatures {
    duration: number;
    sample_rate: number;
    loudness: number;
    dynamic_complexity: number;
    bpm: number;
    spectral_centroid: number;
    spectral_flux: number;
    zero_crossing_rate: number;
}

export async function createSong(req: Request, res: Response, next: NextFunction) {
    const input: CreateSongInput = req.body;
    const jobId = signatureService.generateSignedId();
    const songId = signatureService.generateSignedId();

    // 1. Initialize Processing Job
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
        extractedFeatures: false
    });

    // Ensure project-local 'tmp' directory exists
    const baseTmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(baseTmpDir)) {
        fs.mkdirSync(baseTmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const localDownloadPath = path.join(baseTmpDir, `${path.basename(songId)}`);
    const outputDir = path.join(baseTmpDir, `${timestamp}${songId}`);

    try {
        logger.info(`[PIPELINE] Starting Job ${jobId} for song: ${input.title}`);

        // Update status to processing
        await songProcessingJobRepository.update(songId, { status: "processing" });

        // 1. Verify existence and Download from Temp S3
        await storageService.headObject(TEMP_BUCKET, input.tempSongKey);
        logger.info(`[STEP 1] Downloading raw audio from s3://${TEMP_BUCKET}/${input.tempSongKey}`);
        await storageService.downloadObject(TEMP_BUCKET, input.tempSongKey, localDownloadPath);

        // 2. Transcode & Upload segments to Prod S3
        logger.info(`[STEP 2] Transcoding and uploading multi-bitrate segments...`);
        await transcodingService.transcode(localDownloadPath, outputDir);
        
        const audioName = path.basename(outputDir);
        await songProcessingJobRepository.update(songId, { 
            transcodingAttempt: 1,
            transcodingId: audioName,
            transcoded: true
        });

        // 3. Extract Audio Features (FastAPI)
        logger.info(`[STEP 3] Extracting spectral features via FastAPI...`);
        const response = await axios.post(FEATURE_API_URL, {
            key: input.tempSongKey,
            bucket: TEMP_BUCKET,
        });
        const features = response.data as AudioFeatures;
        
        await songProcessingJobRepository.update(songId, { extractedFeatures: true });

        // 4. Transcription
        const prodSongKey = `${process.env.BASE_PATH || "audios"}/${audioName}`;
        const captionPath = `${prodSongKey}/caption.json`;
        logger.info(`[STEP 4] Generating transcription and saving to S3...`);
        const { language } = await transcriptionService.generateTranscribe(
            localDownloadPath, 
            PROD_BUCKET, 
            captionPath
        );
        
        await songProcessingJobRepository.update(songId, { 
            transcribingAttempt: 1,
            transcribingId: captionPath,
            transcribed: true
        });

        // Update Job with collected metadata
        await songProcessingJobRepository.update(songId, {
            duration: features.duration,
            language: language,
            sampleRate: features.sample_rate,
            loudness: features.loudness,
            dynamicComplexity: features.dynamic_complexity,
            bpm: features.bpm,
            spectralCentroid: features.spectral_centroid,
            spectralFlux: features.spectral_flux,
            zeroCrossingRate: features.zero_crossing_rate,
            songKey: prodSongKey
        });

        // 5. Create Final Song Record
        logger.info(`[STEP 5] Moving data to permanent song library...`);
        await songRepository.create({
            id: songId,
            jobId: jobId,
            title: input.title,
            artistName: input.artistName,
            duration: Math.floor(features.duration * 1000), // convert to ms
            songKey: prodSongKey,
            imageKey: input.imageKey,
            language: language,
        });

        // 6. Secondary Indexing
        logger.info(`[STEP 6] Syncing with search and recommendation engines...`);
        
        // 6a. Recombee
        await recommendationService.create({
            id: songId,
            title: input.title,
            artistName: input.artistName,
            duration: features.duration,
            songKey: prodSongKey,
            imageKey: input.imageKey,
            language: language,
            bpm: features.bpm,
            loudness: features.loudness,
            dynamicComplexity: features.dynamic_complexity,
            spectralCentroid: features.spectral_centroid,
            spectralFlux: features.spectral_flux,
            zeroCrossingRate: features.zero_crossing_rate,
        });
        await songProcessingJobRepository.update(songId, { savedInRecommendation: true });

        // 6b. Algolia
        await searchService.save({
            id: songId,
            title: input.title,
            artistName: input.artistName,
            duration: features.duration,
            songKey: prodSongKey,
            imageKey: input.imageKey,
            language: language,
        });
        await songProcessingJobRepository.update(songId, { savedInSearch: true });

        // Finish Job
        await songProcessingJobRepository.update(songId, { status: "completed" });
        logger.info(`[PIPELINE] Job ${jobId} successful!`);

        return res.status(201).json(new ApiResponse(201, "Song processed and published successfully", {
            id: songId,
            jobId: jobId,
            songKey: prodSongKey,
            language,
            features
        }));

    } catch (error: any) {
        logger.error(`[PIPELINE] Job ${jobId} failed:`, error);
        // We could update job status to 'failed' if we add it to the schema/db check
        next(error);
    } finally {
        // Final Cleanup
        try {
            if (fs.existsSync(localDownloadPath)) fs.unlinkSync(localDownloadPath);
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (cleanupError) {
            logger.error(cleanupError, `[CLEANUP] Warning: Failed to clean up temp files:`);
        }
    }
}
