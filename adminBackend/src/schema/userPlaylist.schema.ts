import { z } from "zod";

// Schema for creating/validating a user playlist
export const userPlaylistSchema = z.object({
    id: z.string(),
    name: z.string({error:"name is required"}).min(1, { message: "Playlist name is required" }),
    userId: z.string({error:"userId is required"}).min(1, { message: "userId is required" }),
});

export type UserPlaylistSchema = z.infer<typeof userPlaylistSchema>;

// Schema for adding a song to a user playlist
export const userPlaylistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string({error:"playlistId is required"}).min(1, { message: "playlistId is required" }),
    songId: z.string({error:"songId is required"}).min(1, { message: "songId is required" }),
},{error:"object is required"});

export type UserPlaylistSongSchema = z.infer<typeof userPlaylistSongSchema>;
