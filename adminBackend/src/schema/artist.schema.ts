import { z } from "zod";

import { registry } from "../docs/openapi-registry";

export const artistSchema = z.object({
    id: z.string().openapi({ description: "Unique identifier for the artist", example: "art_123" }),
    name: z.string().min(1, { message: "name is required" }).openapi({ description: "Full name of the artist", example: "Gurun Randhawa" }),
    about: z.string().min(1, { message: "about is required" }).openapi({ description: "Short biography of the artist", example: "Popular Punjabi singer and songwriter." }),
    // Accept YYYY-MM-DD or ISO datetime — coerced to ISO string before DB insert
    dob: z.string().min(1, { message: "dob is required" }).refine(
        (v) => !isNaN(new Date(v).getTime()),
        { message: "dob must be a valid date (e.g. 2004-09-25)" }
    ).openapi({ description: "Date of birth in YYYY-MM-DD format", example: "1991-08-30" }),
    // Optional for testing — defaults to empty string
    coverImageKey: z.string().openapi({ description: "Imagekit key for the cover image", example: "artists/cover/randhawa.jpg" }),
    bannerImageKey: z.string().openapi({ description: "Imagekit key for the banner image", example: "artists/banner/randhawa_banner.jpg" }),
    createdAt: z.string().datetime().optional().openapi({ description: "Timestamp of creation" }),
}).openapi("Artist");

export type ArtistSchema = z.infer<typeof artistSchema>;

/** Coerce any valid date string to an ISO-8601 datetime string for Postgres */
export function coerceDob(dob: string): string {
    return new Date(dob).toISOString();
}

export const createArtistSchema = artistSchema.omit({ id: true, createdAt: true }).openapi("CreateArtist");

export type CreateArtistSchema = z.infer<typeof createArtistSchema>

export const updateArtistSchema = artistSchema.partial().openapi("UpdateArtist");

export type UpdateArtistSchema = z.infer<typeof updateArtistSchema>;

// Register definitions
registry.register("Artist", artistSchema);
registry.register("CreateArtist", createArtistSchema);
registry.register("UpdateArtist", updateArtistSchema);