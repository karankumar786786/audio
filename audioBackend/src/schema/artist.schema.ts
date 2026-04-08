import { z } from "zod";

export const artistSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: "name is required" }),
    about: z.string().min(1, { message: "about is required" }),
    dob: z.string().datetime({ message: "dob must be a valid ISO datetime" }),
    coverImageKey: z.string().min(1, { message: "coverImageKey is required" }),
    bannerImageKey: z.string().min(1, { message: "bannerImageKey is required" }),
    createdAt: z.string().datetime().optional(),
});

export type ArtistSchema = z.infer<typeof artistSchema>;