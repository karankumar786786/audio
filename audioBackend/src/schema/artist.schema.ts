import { z } from "zod";

export const artistSchema = z.object({
    id: z.string().optional(),
    name: z.string()
        .min(1, { message: "name is required" })
        .min(8, { message: "name should be at least 8 characters" }),
    about: z.string().min(1, { message: "about is required" }),
    dob: z.iso.datetime({ message: "dob must be a valid ISO datetime" }),
    createdAt: z.iso.datetime().optional(),
});

export type ArtistSchema = z.infer<typeof artistSchema>;