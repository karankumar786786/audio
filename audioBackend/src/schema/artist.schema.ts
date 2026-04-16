import { z } from "zod";

export const artistSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: "name is required" }),
    about: z.string().nullable().optional(),
    // Accept YYYY-MM-DD or ISO datetime — coerced to ISO string before DB insert
    dob: z.coerce.string().optional().nullable().refine(
        (v) => !v || !isNaN(new Date(v).getTime()),
        { message: "dob must be a valid date (e.g. 2004-09-25)" }
    ),
    // Optional — defaults to empty string or null
    coverImageKey: z.string().nullable().optional(),
    bannerImageKey: z.string().nullable().optional(),
    createdAt: z.coerce.string().optional(),
});

export type ArtistSchema = z.infer<typeof artistSchema>;

/** Coerce any valid date string to an ISO-8601 datetime string for Postgres */
export function coerceDob(dob: string): string {
    return new Date(dob).toISOString();
}