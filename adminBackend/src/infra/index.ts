import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
config();

import { AlgoliaService } from "../lib/search";
import { S3Service } from "../lib/storage";
import { RecommendationServiceImpl } from "../lib/recommendation";
import { SignatureUtility } from "../lib/signature";
import { logger } from "../observablity/logger";
import { ArtistService } from "../services/artist.service";
import { PlaylistService } from "../services/playlist.service";
import { SongService } from "../services/song.service";

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

// Recommendation Service
export const recommendationService = new RecommendationServiceImpl(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger
);

// Signature Service
export const signatureService = new SignatureUtility(
    `${process.env.SIGNATURE_SECRET}`
);

import { 
    ArtistRepository,
    SystemPlaylistRepository,
    UserPlaylistRepository,
    SongRepository,
    SongProcessingJobRepository,
} from "../repository";

// Repositories
export const artistRepository = new ArtistRepository();
export const systemPlaylistRepository = new SystemPlaylistRepository();
export const userPlaylistRepository = new UserPlaylistRepository();
export const songRepository = new SongRepository();
export const songProcessingJobRepository = new SongProcessingJobRepository();

// Services
export const artistService = new ArtistService();
export const playlistService = new PlaylistService();
export const songService = new SongService();

export const inngest = new Inngest({id:"test-music"})

export const imagekitClient = new ImageKit(
    {
        publicKey:process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
    }
)
