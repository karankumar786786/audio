import { config } from "dotenv";
export type {Database} from "./db";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
import { 
    ArtistRepository,
    PlaylistRepository,
    SongRepository,
    SongProcessingJobRepository,
} from "../repository";
import { AlgoliaSearchService } from "../lib/search";
import { RecommbeeRecommendationService } from "../lib/recommendation";
import { NodeCryptoSignatureService } from "../lib/signature";
import { logger } from "../observablity";
import { ArtistService } from "../services/artist.service";
import { PlaylistService } from "../services/playlist.service";
import { SongService } from "../services/song.service";
import { S3StorageService } from "../lib/storage";
import { MiscService } from "../services/misc.service";
import { db } from "./db";
config();



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

export const storageService = new S3StorageService(
    process.env.REGION!,
    process.env.ACCESS_KEY_ID!,
    process.env.SECRET_KEY!,
    logger.child({ service: "S3Storage" })
);


export const imagekitClient = new ImageKit(
    {
        publicKey:process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
    }
)


// Repositories
export const artistRepository = new ArtistRepository(db, logger.child({ service: "ArtistRepository" }));
export const playlistRepository = new PlaylistRepository(db, logger.child({ service: "PlaylistRepository" }),signatureService);
export const songRepository = new SongRepository(db, logger.child({ service: "SongRepository" }));
export const songProcessingJobRepository = new SongProcessingJobRepository(db, logger.child({ service: "SongJobRepository" }));
export const inngest = new Inngest({id:"test-music"});

// Services
export const artistService = new ArtistService(artistRepository,songRepository,signatureService,searchService,logger.child({ service: "ArtistService" }));
export const playlistService = new PlaylistService(playlistRepository,signatureService,searchService,logger.child({ service: "PlaylistService" }));
export const songService = new SongService(songRepository,songProcessingJobRepository,signatureService,searchService,recommendationService,logger.child({ service: "SongService" }),inngest);
export const miscService = new MiscService(logger.child({ service: "MiscService" }),storageService,imagekitClient,signatureService);

