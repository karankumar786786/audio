import { z } from "zod";

export const songSchema = z.object({
    id: z.string().optional(),
    title: z.string()
        .min(8, { message: "Title should be more than 8 characters" })
        .max(255, { message: "Title should be less than 255 characters" }),
    artistName: z.string().min(1, { message: "artistName is required" }),
    timeInMs: z.number({ message: "timeInMs should be a number in milliseconds" }).positive({ message: "timeInMs must be greater than 0" }),
    genre: z.string().min(1, { message: "genre is required" }),
    songUrl: z.string().min(1, { message: "songUrl is required" }),
    imageUrl: z.string().min(1, { message: "imageUrl is required" }),
    language: z.string().min(1, { message: "language is required" }),
    algoliaObjectId: z.string().min(1, { message: "algoliaObjectId is required" }),
    createdAt: z.iso.datetime().optional(),
});

export type SongSchema = z.infer<typeof songSchema>;
