import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const userPlaylistSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: "Playlist name is required" }),
    userId: z.string().min(1, { message: "userId is required" }),
});

export type UserPlaylistSchema = z.infer<typeof userPlaylistSchema>;

export const userPlaylistSongSchema = z.object({
    id: z.string().optional(),
    playlistId: z.string().min(1, { message: "playlistId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
});

export type UserPlaylistSongSchema = z.infer<typeof userPlaylistSongSchema>;
