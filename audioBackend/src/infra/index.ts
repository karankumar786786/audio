import { config } from "dotenv";
config();

import { AlgoliaService } from "../lib/search";
import { S3Service } from "../lib/storage/s3";
import { AudioTranscoder } from "../lib/transcode";
import { RecommendationServiceImpl } from "../lib/recommendation/recombee";
import { SignatureUtility } from "../lib/signature/signature";
import { generateTranscribe } from "../lib/transcribeAudio/generateTranscribe";

// Database re-export
export { db } from "./db";

// Search Service
export const searchService = new AlgoliaService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`
);

// Storage Service
export const storageService = new S3Service(
    `${process.env.REGION}`,
    `${process.env.ACCESS_KEY_ID}`,
    `${process.env.SECRET_KEY}`
);

// Transcoding Service
export const transcodingService = new AudioTranscoder(
    6,
    storageService.getClient(),
    `${process.env.PRODUCTION_BUCKET_NAME}`,
    `${process.env.BASE_PATH}`
);

// Recommendation Service
export const recommendationService = new RecommendationServiceImpl(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`
);

// Signature Service
export const signatureService = new SignatureUtility(
    `${process.env.SIGNATURE_SECRET}`
);

// Transcribe Audio Service
export { generateTranscribe as transcribeAudio };
