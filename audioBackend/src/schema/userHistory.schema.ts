import { z } from "zod";

// Schema for recording a song listen in user history
export const userHistorySchema = z.object({
    id: z.string(),
    userId: z.string().min(1, { message: "userId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
    part: z.number().int().min(0),
    listenedAt: z.coerce.string().optional(),
});

export type UserHistorySchema = z.infer<typeof userHistorySchema>;
