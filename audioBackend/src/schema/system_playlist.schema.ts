import { z } from "zod";

export const systemPlaylistSchema = z.object({
    id: z.string().optional(),
    playlistName: z.string().min(1, { message: "playlistName is required" }),
    about: z.string().min(1, { message: "about is required" }),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type SystemPlaylistSchema = z.infer<typeof systemPlaylistSchema>;

// Schema for adding a song to a system playlist
export const systemPlaylistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string().min(1, { message: "playlistId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
});

export type SystemPlaylistSongSchema = z.infer<typeof systemPlaylistSongSchema>;
