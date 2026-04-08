import { type Request, type Response, type NextFunction } from "express";
import * as path from "node:path";
import * as fs from "node:fs";
import axios from "axios";
import { promises as fsa } from "fs";
import {
    storageService,
    transcodingService,
    recommendationService,
    searchService,
    signatureService,
    logger,
    transcriptionService
} from "../infra";
import type { CreateSongInput } from "../schema/songs.schema";
import { ApiResponse } from "../utils/ApiResponse";



const TEMP_BUCKET = process.env.TEMP_BUCKET_NAME || "videotranscodetemp";
const PROD_BUCKET = process.env.PRODUCTION_BUCKET_NAME || "videotranscodeprod";
const FEATURE_API_URL = process.env.FEATURE_API_URL || "http://localhost:8000";

interface AudioFeatures {
    key: string;
    duration: number;
    sample_rate: number;
    loudness: number;
    dynamic_complexity: number;
    bpm: number;
    spectral_centroid: number;
    spectral_flux: number;
    zero_crossing_rate: number;
}

export class SongController {

    async createSong(req: Request, res: Response, next: NextFunction) {
        const input: CreateSongInput = req.body;
        const tempId = signatureService.generateSignedId();

        // Ensure project-local 'tmp' directory exists
        const baseTmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(baseTmpDir)) {
            fs.mkdirSync(baseTmpDir, { recursive: true });
        }

        const timestamp = Date.now();
        const localDownloadPath = path.join(baseTmpDir, `${path.basename(tempId)}`);
        const outputDir = path.join(baseTmpDir, `${timestamp}${tempId}`);

        try {
            logger.info(`[PIPELINE] Starting for song: ${input.title} (ID: ${tempId})`);
            await storageService.headObject(TEMP_BUCKET, input.tempSongKey);
            // 1. Download from Temp S3
            logger.info(`[STEP 1] Downloading s3://${TEMP_BUCKET}/${input.tempSongKey}`);
            await storageService.downloadObject(TEMP_BUCKET, input.tempSongKey, localDownloadPath);
            // 2. Transcode & Upload to Prod S3
            // The transcoder now handles transcription internally and returns the languageCode.
            logger.info(`[STEP 2] Transcoding, transcribing, and uploading to s3://${PROD_BUCKET}`);
            await transcodingService.transcode(localDownloadPath, outputDir);
            await fsa.access(localDownloadPath);
            await fsa.unlink(localDownloadPath);
            // 3. Extract Audio Features (FastAPI)
            logger.info(`[STEP 3] Extracting features from FastAPI...`);
            const response = await axios.post(FEATURE_API_URL, {
                key: input.tempSongKey,
                bucket: TEMP_BUCKET,
            });

            const features = response.data as AudioFeatures;

            // Use the basename of outputDir as the identifier in S3 if transcoder uses it
            const audioName = path.basename(outputDir);
            const prodSongKey = `${process.env.BASE_PATH || "audios"}/${audioName}`;
            await storageService.headObject(TEMP_BUCKET, input.tempSongKey);
            // 1. Download from Temp S3
            logger.info(`[STEP 1] Downloading s3://${TEMP_BUCKET}/${input.tempSongKey}`);
            await storageService.downloadObject(TEMP_BUCKET, input.tempSongKey, localDownloadPath);
            const { language } = await transcriptionService.generateTranscribe(localDownloadPath, PROD_BUCKET, `${prodSongKey}/caption.json`)
            // 5. Index in Recombee
            logger.info(`[STEP 5] Indexing in Recombee...`);
            await recommendationService.create({
                id: tempId,
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

            // 6. Index in Algolia
            logger.info(`[STEP 6] Indexing in Algolia...`);
            await searchService.save({
                id: tempId,
                title: input.title,
                artistName: input.artistName,
                duration: features.duration,
                songKey: prodSongKey,
                imageKey: input.imageKey,
                language: language,
            });

            logger.info(`[PIPELINE] Success! Song ID: ${tempId}`);

            return res.status(201).json(new ApiResponse(201, "Song created and processed successfully", {
                id: tempId,
                songKey: prodSongKey,
                language,
                features
            }));

        } catch (error: any) {
            logger.error(`[PIPELINE] Failed:`, error);
            next(error);
        } finally {
            // Cleanup
            try {
                if (fs.existsSync(localDownloadPath)) fs.unlinkSync(localDownloadPath);
                if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
            } catch (cleanupError) {
                logger.error(cleanupError, `[CLEANUP] Warning: Failed to clean up temp files:`);
            }
        }
    }
}

export const songController = new SongController();
