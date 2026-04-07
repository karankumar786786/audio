import { z } from "zod";

// Schema for creating/validating a user playlist
export const userPlaylistSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "Playlist name is required" }),
    userId: z.string().min(1, { message: "userId is required" }),
});

export type UserPlaylistSchema = z.infer<typeof userPlaylistSchema>;

// Schema for adding a song to a user playlist
export const userPlaylistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string().min(1, { message: "playlistId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
});

export type UserPlaylistSongSchema = z.infer<typeof userPlaylistSongSchema>;
