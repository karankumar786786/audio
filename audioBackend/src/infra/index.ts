import { config } from "dotenv";
import { Inngest } from "inngest";
import ImageKit from "imagekit";
config();

import { 
    AlgoliaSearchService, 
    NodeCryptoSignatureService, 
    S3StorageService, 
    RecommbeeRecommendationService,
    Jose,
    type JWTService
} from "../lib";
import { logger } from "../observability";
import { db } from "./db";

// Repositories
import { 
    SongRepository, 
    ArtistRepository, 
    PlaylistRepository, 
    UserPlaylistRepository, 
    UserFavouriteSongRepository, 
    UserHistoryRepository, 
    UserRepository, 
    UserSearchHistoryRepository, 
    InteractionRepository 
} from "../repository";

// Services
import { 
    InteractionService, 
    SearchService, 
    UserService, 
    PlaylistService, 
    ArtistService, 
    SongService 
} from "../services";


// Controllers
import { 
    ArtistController,
    SongController,
    PlaylistController,
    UserController,
    InteractionController,
    SearchController,
    SystemStatusController
 } from "../controllers";


// Logger export
export { logger };

// Database export
export { db };

// --- 1. Library Services ---

export const searchService = new AlgoliaSearchService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`,
    logger.child({ service: "AlgoliaSearchService" })
);

export const storageService = new S3StorageService(
    `${process.env.REGION}`,
    `${process.env.ACCESS_KEY_ID}`,
    `${process.env.SECRET_KEY}`,
    logger.child({ service: "S3StorageService" })
);

export const recommendationService = new RecommbeeRecommendationService(
    `${process.env.RECOMBEE_DATABASE}`,
    `${process.env.RECOMBEE_DATABASE_PRIVATE_TOKEN}`,
    `${process.env.RECOMBEE_DATABASE_REGION}`,
    logger.child({ service: "RecommbeeService" })
);

export const signatureService = new NodeCryptoSignatureService(
    `${process.env.SIGNATURE_SECRET}`
);

export const imagekitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});

export const inngest = new Inngest({ id: "test-music" });
export const jwtServices:JWTService = new Jose(process.env.JWT_SECRET!,process.env.JWT_EXPIRY_IN_HR!,process.env.JWT_ISSUER!);

// --- 2. Repositories (Wired with DI) ---

const artistRepository = new ArtistRepository(db, logger.child({ service: "ArtistRepository" }), signatureService);
const songRepository = new SongRepository(db, logger.child({ service: "SongRepository" }), signatureService);
const playlistRepository = new PlaylistRepository(db, logger.child({ service: "PlaylistRepository" }), signatureService);
const userPlaylistRepository = new UserPlaylistRepository(db, logger.child({ service: "UserPlaylistRepository" }), signatureService);
const userFavouriteSongRepository = new UserFavouriteSongRepository(db, logger.child({ service: "UserFavouriteSongRepository" }),signatureService);
const userHistoryRepository = new UserHistoryRepository(db, logger.child({ service: "UserHistoryRepository" }),signatureService);
const userRepository = new UserRepository(db, logger.child({ service: "UserRepository" }), signatureService);
const userSearchHistoryRepository = new UserSearchHistoryRepository(db, logger.child({ service: "UserSearchHistoryRepository" }), signatureService);
const interactionRepository = new InteractionRepository(db, logger.child({ service: "InteractionRepository" }), signatureService);

// --- 3. Services (Wired with DI) ---

export const artistService = new ArtistService(artistRepository, songRepository, logger.child({ service: "ArtistService" }), signatureService);
export const songService = new SongService(songRepository, logger.child({ service: "SongService" }),signatureService);
export const playlistService = new PlaylistService(playlistRepository, logger.child({ service: "PlaylistService" }), signatureService);
export const userService = new UserService(
    userRepository,
    userFavouriteSongRepository,
    userHistoryRepository,
    userSearchHistoryRepository,
    userPlaylistRepository,
    signatureService,
    logger.child({ service: "UserService" }),
    jwtServices
);
export const interactionService = new InteractionService(
    userHistoryRepository,
    interactionRepository,
    songRepository,
    recommendationService,
    signatureService,
    logger.child({ service: "InteractionService" })
);
export const internalSearchService = new SearchService(searchService, logger.child({ service: "SearchService" }));

// --- 4. Controllers (Wired with DI) ---

export const artistController = new ArtistController(artistService, logger.child({ service: "ArtistController" }));
export const songController = new SongController(songService, logger.child({ service: "SongController" }));
export const playlistController = new PlaylistController(playlistService, logger.child({ service: "PlaylistController" }));
export const userController = new UserController(userService, logger.child({ service: "UserController" }));
export const interactionController = new InteractionController(interactionService, logger.child({ service: "InteractionController" }));
export const searchController = new SearchController(internalSearchService, logger.child({ service: "SearchController" }));
export const systemStatusController = new SystemStatusController(logger.child({ service: "SystemStatusController" }));