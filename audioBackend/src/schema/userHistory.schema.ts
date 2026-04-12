import { z } from "zod";

// Schema for recording a song listen in user history
export const userHistorySchema = z.object({
    id: z.string(),
    userId: z.string({error:"valid userId is required"}).min(1, { message: "userId is required" }),
    songId: z.string({error:"valid songId is required"}).min(1, { message: "songId is required" }),
    part: z.number({error:"part is required"}).int({error:"number is required"}).min(0),
    listenedAt: z.string().datetime().optional(),
});

export type UserHistorySchema = z.infer<typeof userHistorySchema>;
