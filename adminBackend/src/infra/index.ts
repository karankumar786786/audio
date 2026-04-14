import { config } from "dotenv";
config();
export type { Database } from "./db";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
import {
    ArtistRepository,
    PlaylistRepository,
    SongRepository,
    SongProcessingJobRepository,
} from "../repository";
import {
    AlgoliaSearchService,
    RecommbeeRecommendationService,
    NodeCryptoSignatureService
} from "../lib";
import { logger } from "../observablity";
import {
    PlaylistService,
    MiscService, SongService,
    ArtistService
} from "../services";
import { S3StorageService } from "../lib";
import { db } from "./db";




// Search Service
const searchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger.child({ service: "AlgoliaSearch" })
);

// Recommendation Service
const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
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


export const imagekitClient = new ImageKit(
    {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
    }
)


// Repositories
const artistRepository = new ArtistRepository(db, logger.child({ service: "ArtistRepository" }));
const playlistRepository = new PlaylistRepository(db, logger.child({ service: "PlaylistRepository" }));
const songRepository = new SongRepository(db, logger.child({ service: "SongRepository" }));
const songProcessingJobRepository = new SongProcessingJobRepository(db, logger.child({ service: "SongJobRepository" }));
const inngest = new Inngest({ id: "test-music" });

// Services
export const artistService = new ArtistService(artistRepository, songRepository, signatureService, searchService, logger.child({ service: "ArtistService" }));
export const playlistService = new PlaylistService(playlistRepository, signatureService, searchService, logger.child({ service: "PlaylistService" }));
export const songService = new SongService(songRepository, songProcessingJobRepository, signatureService, searchService, recommendationService, logger.child({ service: "SongService" }), inngest);
export const miscService = new MiscService(logger.child({ service: "MiscService" }), storageService, imagekitClient, signatureService);

