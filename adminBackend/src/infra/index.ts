import { config } from "dotenv";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
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
config();

export const db = neon(`${process.env.DATABASE_URL}`);
export type Database = NeonQueryFunction<false, false>;

// Search Service
const searchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger
);

// Recommendation Service
const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger
);

// Signature Service
export const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);



// Repositories
export const artistRepository = new ArtistRepository(db, logger);
export const playlistRepository = new PlaylistRepository(db, logger,signatureService);
export const songRepository = new SongRepository(db, logger);
export const songProcessingJobRepository = new SongProcessingJobRepository(db, logger);
export const inngest = new Inngest({id:"test-music"});

// Services
export const artistService = new ArtistService(artistRepository,songRepository,signatureService,searchService);
export const playlistService = new PlaylistService(playlistRepository,signatureService,searchService);
export const songService = new SongService(songRepository,songProcessingJobRepository,signatureService,searchService,recommendationService,logger,inngest);


export const imagekitClient = new ImageKit(
    {
        publicKey:process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
    }
)
