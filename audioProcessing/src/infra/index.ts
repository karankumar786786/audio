import { config } from "dotenv";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
config();

import { 
    createDb,
    AlgoliaSearchService,
    S3StorageService,
    RecommbeeRecommendationService,
    NodeCryptoSignatureService,
    SongRepository,
    SongProcessingJobRepository
} from "@onemelody/core";

import { AudioTranscoder } from "../lib/transcode";
import { TranscriptionService } from "../lib/transcribeAudio";
import { logger } from "../observablity";

// Logger export
export { logger };

// Database export
export const db = createDb(process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock");

// Search Service
export const searchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger
);

// Storage Service
export const storageService = new S3StorageService(
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
export const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    process.env.RECOMBEE_DATABASE_REGION || "us-west",
    logger
);

export const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);

// Repositories
export const songRepository = new SongRepository(db, logger, signatureService);
export const songProcessingJobRepository = new SongProcessingJobRepository(db, logger, signatureService);

import { AudioProcessingService } from "../services";

export const imagekitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});

// Main Service
export const audioProcessingService = new AudioProcessingService(
    songRepository,
    songProcessingJobRepository,
    transcodingService,
    transcriptionService,
    searchService,
    recommendationService,
    storageService,
    imagekitClient,
    signatureService,
    logger
);

export const inngest = new Inngest({ id: "audio-processing" });
