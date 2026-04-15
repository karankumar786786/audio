import { z } from "zod";

export const playlistSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: "name is required" }),
    description: z.string().optional(),
    coverImageKey: z.string().min(1, { message: "coverImageKey is required" }),
    bannerImageKey: z.string().min(1, { message: "bannerImageKey is required" }),
    createdAt: z.coerce.string().optional(),
    updatedAt: z.coerce.string().optional(),
});

export type PlaylistSchema = z.infer<typeof playlistSchema>;

// Schema for adding a song to a playlist
export const playlistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string().min(1, { message: "playlistId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
});

export type PlaylistSongSchema = z.infer<typeof playlistSongSchema>;

