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
    UserRepository,
    
    // Infra
    AlgoliaSearchService,
    RecommbeeRecommendationService,
    NodeCryptoSignatureService,
    S3StorageService,
    Jose,
    type JWTService,
    
    // Services
    PlaylistService,
    MiscService,
    SongService,
    ArtistService,
    SearchService,
    AuthService
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
export const userRepository = new UserRepository(db, logger.child({ service: "UserRepository" }), signatureService);

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

export const jwtServices: JWTService = new Jose(
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRY_IN_HR!,
    process.env.JWT_ISSUER!
);

export const authService = new AuthService(
    userRepository,
    jwtServices,
    process.env.SIGNATURE_SECRET!,
    process.env.JWT_SECRET!
);
