import { z } from "zod";

export const systemPlaylistSchema = z.object({
    id: z.string(),
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
    playlistId: z.string({error:"valid playlistId is required"}).min(1, { message: "playlistId is required" }),
    songId: z.string({error:"valid songId is required"}).min(1, { message: "songId is required" }),
});

export type SystemPlaylistSongSchema = z.infer<typeof systemPlaylistSongSchema>;

export const createSystemPlaylistInput = systemPlaylistSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({
        name: z.string({ error: "name is required" }).min(1, { message: "name cannot be empty" }),
        coverImageKey: z.string({ error: "coverImageKey is required" }).min(1, { message: "coverImageKey cannot be empty" }),
        bannerImageKey: z.string({ error: "bannerImageKey is required" }).min(1, { message: "bannerImageKey cannot be empty" }),
    });


export const systemPlaylistSongInput = systemPlaylistSongSchema.omit({ id: true });