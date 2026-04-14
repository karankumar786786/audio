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
import { SongRepository } from "../repository/song.repository";
import { SongProcessingJobRepository } from "../repository/song-processing-job.repository";
import { ArtistRepository } from "../repository/artist.repository";
import { PlaylistRepository } from "../repository/playlist.repository";
import { UserPlaylistRepository } from "../repository/user-playlist.repository";
import { UserFavouriteSongRepository } from "../repository/user-favourite-song.repository";
import { UserHistoryRepository } from "../repository/user-history.repository";
import { UserRepository } from "../repository/user.repository";
import { UserSearchHistoryRepository } from "../repository/user-search-history.repository";
import { InteractionRepository } from "../repository/interaction.repository";

// Services
import { SongService } from "../services/song.service";
import { ArtistService } from "../services/artist.service";
import { PlaylistService } from "../services/playlist.service";
import { UserService } from "../services/user.service";
import { InteractionService } from "../services/interaction.service";
import { SearchService } from "../services/search.service";

// Controllers
import { ArtistController } from "../controllers/artist.controller";
import { SongController } from "../controllers/song.controller";
import { PlaylistController } from "../controllers/playlist.controller";
import { UserController } from "../controllers/user.controller";
import { InteractionController } from "../controllers/interaction.controller";
import { UserPlaylistController } from "../controllers/user-playlist.controller";
import { SearchController } from "../controllers/search.controller";
import { MiscController } from "../controllers/misc.controller";
import { SystemStatusController } from "../controllers/system-status.controller";

// Logger export
export { logger };

// Database export
export { db };

// --- 1. Library Services ---

const searchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger
);

const storageService = new S3StorageService(
    `${process.env.REGION}`,
    `${process.env.ACCESS_KEY_ID}`,
    `${process.env.SECRET_KEY}`,
    logger
);

const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger
);

const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);

export const imagekitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});

export const inngest = new Inngest({ id: "test-music" });

// --- 2. Repositories (Wired with DI) ---

const artistRepository = new ArtistRepository(db, logger);
const songRepository = new SongRepository(db, logger);
const songProcessingJobRepository = new SongProcessingJobRepository(db, logger);
const playlistRepository = new PlaylistRepository(db, logger);
const userPlaylistRepository = new UserPlaylistRepository(db, logger);
const userFavouriteSongRepository = new UserFavouriteSongRepository(db, logger);
const userHistoryRepository = new UserHistoryRepository(db, logger);
const userRepository = new UserRepository(db, logger);
const userSearchHistoryRepository = new UserSearchHistoryRepository(db, logger);
const interactionRepository = new InteractionRepository(db, logger);

// --- 3. Services (Wired with DI) ---

export const artistService = new ArtistService(artistRepository, songRepository, logger);
export const songService = new SongService(songRepository, logger);
export const playlistService = new PlaylistService(playlistRepository, logger);
export const userService = new UserService(
    userRepository, 
    userFavouriteSongRepository, 
    userHistoryRepository, 
    userSearchHistoryRepository, 
    signatureService,
    logger
);
export const interactionService = new InteractionService(
    userHistoryRepository, 
    interactionRepository, 
    recommendationService, 
    signatureService, 
    logger
);
export const internalSearchService = new SearchService(searchService, logger);

// --- 4. Controllers (Wired with DI) ---

export const artistController = new ArtistController(artistService, logger);
export const songController = new SongController(songService, logger);
export const playlistController = new PlaylistController(playlistService, logger);
export const userController = new UserController(userService, logger);
export const interactionController = new InteractionController(interactionService, logger);
export const userPlaylistController = new UserPlaylistController(userPlaylistRepository, logger);
export const searchController = new SearchController(internalSearchService, logger);
export const miscController = new MiscController(signatureService, storageService, imagekitClient, logger);
export const systemStatusController = new SystemStatusController(logger);