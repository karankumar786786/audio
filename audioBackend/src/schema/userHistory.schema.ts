import { z } from "zod";
import { songSchema } from "./songs.schema";

// Schema for recording a song listen in user history
export const userHistorySchema = z.object({
    id: z.string(),
    userId: z.string().min(1, { message: "userId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
    part: z.number().int().min(0),
    listenedAt: z.coerce.string().optional(),
});

export type UserHistorySchema = z.infer<typeof userHistorySchema>;

// Combined schema for history results (Listen Event + Song Details)
export const historyEventSchema = songSchema.extend({
    historyId: z.string(),
    listenedAt: z.coerce.string(),
    part: z.number(),
});

export type HistoryEvent = z.infer<typeof historyEventSchema>;
