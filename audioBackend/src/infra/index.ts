import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import {Inngest} from "inngest";
config();

import { AlgoliaService } from "../lib/search";
import { S3Service } from "../lib/storage";
import { AudioTranscoder } from "../lib/transcode";
import { RecommendationServiceImpl } from "../lib/recommendation";
import { SignatureUtility } from "../lib/signature";
import { TranscriptionService } from "../lib/transcribeAudio";
import { logger } from "../observablity/logger";
import { SongService } from "../services/song.service";
import { ArtistService } from "../services/artist.service";
import { PlaylistService } from "../services/playlist.service";
import { UserService } from "../services/user.service";
import { InteractionService } from "../services/interaction.service";
import { SearchService } from "../services/search.service";

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
    `${process.env.SARVAM_API_KEY}`,
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
    ArtistRepository,
    SystemPlaylistRepository,
    UserPlaylistRepository,
    UserFavouriteSongRepository,
    UserHistoryRepository,
    UserSearchHistoryRepository,
} from "../repository";

// Signature Service
export const signatureService = new SignatureUtility(
    `${process.env.SIGNATURE_SECRET}`
);

// Repositories
export const songRepository = new SongRepository();
export const songProcessingJobRepository = new SongProcessingJobRepository();
export const artistRepository = new ArtistRepository();
export const systemPlaylistRepository = new SystemPlaylistRepository();
export const userPlaylistRepository = new UserPlaylistRepository();
export const userFavouriteSongRepository = new UserFavouriteSongRepository();
export const userHistoryRepository = new UserHistoryRepository();
export const userSearchHistoryRepository = new UserSearchHistoryRepository();

// Services
export const songService = new SongService();
export const artistService = new ArtistService();
export const playlistService = new PlaylistService();
export const userService = new UserService();
export const interactionService = new InteractionService();
export const internalSearchService = new SearchService();

export const inngest = new Inngest({id:"test-music"})