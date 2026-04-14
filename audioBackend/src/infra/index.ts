import { config } from "dotenv";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
config();

import { AlgoliaSearchService } from "../lib/search";
import { S3StorageService } from "../lib/storage";
import { RecommbeeRecommendationService } from "../lib/recommendation";
import { NodeCryptoSignatureService } from "../lib/signature";
import { logger } from "../observability";
import { db } from "./db";

// Repositories
import {
    SongRepository,
    SongProcessingJobRepository,
    ArtistRepository,
    PlaylistRepository,
    UserPlaylistRepository,
    UserFavouriteSongRepository,
    UserHistoryRepository,
    UserRepository,
    UserSearchHistoryRepository,
} from "../repository";

// Services
import { SongService } from "../services/song.service";
import { ArtistService } from "../services/artist.service";
import { PlaylistService } from "../services/playlist.service";
import { UserService } from "../services/user.service";
import { InteractionService } from "../services/interaction.service";
import { SearchService } from "../services/search.service";

// Controllers
import { ArtistController } from "../controllers/artist.controller";

// Logger export
export { logger };

// Database export
export { db };

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

// Recommendation Service
export const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger
);

// Signature Service
export const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);

// Repositories (Wired with DI)
export const artistRepository = new ArtistRepository(db, logger);
// Note: Other repos still use old pattern, will be refactored incrementally
export const songRepository = new SongRepository();
export const songProcessingJobRepository = new SongProcessingJobRepository();
export const playlistRepository = new PlaylistRepository();
export const userPlaylistRepository = new UserPlaylistRepository();
export const userFavouriteSongRepository = new UserFavouriteSongRepository();
export const userHistoryRepository = new UserHistoryRepository();
export const userRepository = new UserRepository();
export const userSearchHistoryRepository = new UserSearchHistoryRepository();

// Services (Wired with DI)
export const artistService = new ArtistService(artistRepository, db, logger);
export const songService = new SongService();
export const playlistService = new PlaylistService();
export const userService = new UserService();
export const interactionService = new InteractionService();
export const internalSearchService = new SearchService();

// Controllers (Wired with DI)
export const artistController = new ArtistController(artistService, logger);

export const inngest = new Inngest({ id: "test-music" });

export const imagekitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});