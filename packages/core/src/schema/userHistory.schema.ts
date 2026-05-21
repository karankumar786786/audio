import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);
import { songSchema } from "./songs.schema";

export const userHistorySchema = z.object({
    id: z.string(),
    userId: z.string().min(1, { message: "userId is required" }),
    songId: z.string().min(1, { message: "songId is required" }),
    part: z.number().int().min(0),
    listenedAt: z.coerce.string().optional(),
});

export type UserHistorySchema = z.infer<typeof userHistorySchema>;

export const historyEventSchema = songSchema.extend({
    historyId: z.string(),
    listenedAt: z.coerce.string(),
    part: z.number(),
});

export type HistoryEvent = z.infer<typeof historyEventSchema>;
