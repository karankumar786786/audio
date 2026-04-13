import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import {Inngest} from "inngest";
config();

import { AlgoliaService } from "../lib/search";
import { S3Service } from "../lib/storage";
import { AudioTranscoder } from "../lib/transcode";
import { RecommendationServiceImpl } from "../lib/recommendation";
import { TranscriptionService } from "../lib/transcribeAudio";
import { logger } from "../observablity/logger";

// Logger export
export { logger };

// Database export
export const db = neon(`${process.env.DATABASE_URL}`);

// Search Service
export const searchService = new AlgoliaService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger
);

// Storage Service
export const storageService = new S3Service(
    `${process.env.REGION}`,
    `${process.env.ACCESS_KEY_ID}`,
    `${process.env.SECRET_KEY}`,
    logger
);

// Transcription Service
export const transcriptionService = new TranscriptionService(
    logger,
    `${process.env.ASSEMBLY_API_KEY}`,
    storageService.getClient()
);

// Transcoding Service
export const transcodingService = new AudioTranscoder(
    6,
    storageService.getClient(),
    `${process.env.BASE_PATH}`,
    `${process.env.PRODUCTION_BUCKET_NAME}`,
    logger,
);

// Recommendation Service
export const recommendationService = new RecommendationServiceImpl(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger
);

import { 
    SongRepository, 
    SongProcessingJobRepository,
} from "../repository";

// Repositories
export const songRepository = new SongRepository();
export const songProcessingJobRepository = new SongProcessingJobRepository();

export const inngest = new Inngest({id:"test-music"})
