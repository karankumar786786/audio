import { config } from "dotenv";
config();
import { Inngest } from "inngest";
import ImageKit from "imagekit";
import {
    // Repositories
    ArtistRepository,
    PlaylistRepository,
    SongRepository,
    SongProcessingJobRepository,
    
    // Infra
    AlgoliaSearchService,
    RecommbeeRecommendationService,
    NodeCryptoSignatureService,
    S3StorageService,
    
    // Services
    PlaylistService,
    MiscService,
    SongService,
    ArtistService,
    SearchService
} from "@onemelody/core";
import { logger } from "../observablity";
import { db } from "./db";

// Search Service
const algoliaSearchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger.child({ service: "AlgoliaSearch" })
);

// Recommendation Service
const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    process.env.RECOMBEE_DATABASE_REGION || "us-west",
    logger.child({ service: "Recommbee" })
);

// Signature Service
const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);

const storageService = new S3StorageService(
    process.env.REGION!,
    process.env.ACCESS_KEY_ID!,
    process.env.SECRET_KEY!,
    logger.child({ service: "S3Storage" })
);

export const imagekitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});

// Repositories
const artistRepository = new ArtistRepository(db, logger.child({ service: "ArtistRepository" }), signatureService);
const playlistRepository = new PlaylistRepository(db, logger.child({ service: "PlaylistRepository" }), signatureService);
const songRepository = new SongRepository(db, logger.child({ service: "SongRepository" }), signatureService);
const songProcessingJobRepository = new SongProcessingJobRepository(db, logger.child({ service: "SongJobRepository" }), signatureService);

export const inngest = new Inngest({ 
    id: "admin-backend",
});

// Services
export const artistService = new ArtistService(
    artistRepository,
    songRepository,
    signatureService,
    logger.child({ service: "ArtistService" }),
    algoliaSearchService,
    imagekitClient
);

export const playlistService = new PlaylistService(
    playlistRepository,
    signatureService,
    logger.child({ service: "PlaylistService" }),
    algoliaSearchService,
    imagekitClient
);

export const songService = new SongService(
    songRepository, 
    signatureService,
    logger.child({ service: "SongService" }), 
    songProcessingJobRepository, 
    algoliaSearchService, 
    recommendationService, 
    storageService,
    imagekitClient,
    inngest
);

export const miscService = new MiscService(
    logger.child({ service: "MiscService" }),
    storageService,
    imagekitClient,
    signatureService
);

export const searchService = new SearchService(algoliaSearchService, logger.child({ service: "UnifiedSearchService" }));
