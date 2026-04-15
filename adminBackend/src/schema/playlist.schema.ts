import { z } from "zod";

import { registry } from "../docs/openapi-registry";

export const playlistSchema = z.object({
    id: z.string().openapi({ description: "Unique identifier for the playlist", example: "ply_123" }),
    name: z.string().min(1, { message: "name is required" }).openapi({ description: "Name of the playlist", example: "Top Hits 2024" }),
    coverImageKey: z.string().min(1, { message: "coverImageKey is required" }).openapi({ description: "S3 key for the playlist cover", example: "playlists/cover/hits.jpg" }),
    bannerImageKey: z.string().min(1, { message: "bannerImageKey is required" }).openapi({ description: "S3 key for the playlist banner artist", example: "playlists/banner/hits_wide.jpg" }),
    createdAt: z.coerce.string().optional().openapi({ description: "Creation timestamp" }),
    updatedAt: z.coerce.string().optional().openapi({ description: "Last update timestamp" }),
}).openapi("Playlist");

export type PlaylistSchema = z.infer<typeof playlistSchema>;

// Schema for adding a song to a playlist
export const playlistSongSchema = z.object({
    id: z.string().optional().openapi({ description: "Relationship entry ID", example: "ps_789" }),
    playlistId: z.string().min(1, { message: "playlistId is required" }).openapi({ description: "Target playlist ID", example: "ply_123" }),
    songId: z.string().min(1, { message: "songId is required" }).openapi({ description: "Target song ID", example: "song_abc" }),
}).openapi("PlaylistSong");

export type PlaylistSongSchema = z.infer<typeof playlistSongSchema>;

export const createPlaylistInput = playlistSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({
        name: z.string().min(1, { message: "name cannot be empty" }).openapi({ description: "Name of the new playlist", example: "Party Vibes" }),
        coverImageKey: z.string().min(1, { message: "coverImageKey cannot be empty" }).openapi({ description: "Initial cover art key", example: "temp/cover.jpg" }),
        bannerImageKey: z.string().min(1, { message: "bannerImageKey cannot be empty" }).openapi({ description: "Initial banner art key", example: "temp/banner.jpg" }),
    }).openapi("CreatePlaylistRequest");

export type CreatePlaylistSchema = z.infer<typeof createPlaylistInput>;

export const playlistSongInput = playlistSongSchema.omit({ id: true }).openapi("AddSongToPlaylistRequest");
export type CreatePlaylistData = Omit<PlaylistSchema, "createdAt" | "updatedAt">;
export type UpdatePlaylistData = Partial<CreatePlaylistData>;

// Register definitions
registry.register("Playlist", playlistSchema);
registry.register("PlaylistSong", playlistSongSchema);
registry.register("CreatePlaylistRequest", createPlaylistInput);
registry.register("AddSongToPlaylistRequest", playlistSongInput);