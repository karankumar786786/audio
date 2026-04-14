import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import * as schemas from "../schema";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// --- Domain Schemas ---

export const ArtistSchemaDoc = registry.register("Artist", schemas.artistSchema);
export const SongSchemaDoc = registry.register("Song", schemas.songSchema);
export const PlaylistSchemaDoc = registry.register("Playlist", schemas.playlistSchema);
export const UserSchemaDoc = registry.register("User", schemas.userSchema);
export const UserPlaylistSchemaDoc = registry.register("UserPlaylist", schemas.userPlaylistSchema);
export const UserHistorySchemaDoc = registry.register("UserHistory", schemas.userHistorySchema);
export const UserFavouriteSongSchemaDoc = registry.register("UserFavouriteSong", schemas.userFavouriteSongSchema);
export const UserSearchHistorySchemaDoc = registry.register("UserSearchHistory", schemas.userSearchHistorySchema);
export const SongProcessingJobSchemaDoc = registry.register("SongProcessingJob", schemas.SongProcessingJobSchema);

// --- API Commons ---

export const ApiResponseSchema = registry.register("ApiResponse", z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
}));

export const PaginationParamsSchema = registry.register("PaginationParams", z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
}));

export const PaginatedResultSchema = registry.register("PaginatedResult", z.object({
  data: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
}));
