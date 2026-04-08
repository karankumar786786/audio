import { z } from "zod";

export const userFavouriteSongSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, { message: "userId is required" }),
  songId: z.string().min(1, { message: "songId is required" }),
});

export type UserFavouriteSongSchema = z.infer<typeof userFavouriteSongSchema>;
