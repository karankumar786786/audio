import { z } from "zod";

export const systemPlaylistSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "name is required" }),
    coverImageKey: z.string().min(1, { message: "coverImageKey is required" }),
    bannerImageKey: z.string().min(1, { message: "bannerImageKey is required" }),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});

export type SystemPlaylistSchema = z.infer<typeof systemPlaylistSchema>;

// Schema for adding a song to a system playlist
export const systemPlaylistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string().min(1, { message: "playlistId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
});

export type SystemPlaylistSongSchema = z.infer<typeof systemPlaylistSongSchema>;
