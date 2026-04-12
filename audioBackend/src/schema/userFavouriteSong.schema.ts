import { z } from "zod";

export const userFavouriteSongSchema = z.object({
  id: z.string(),
  userId: z.string({error:"valid userId is required"}).min(1, { message: "userId is required" }),
  songId: z.string({error:"valid songId is required"}).min(1, { message: "songId is required" }),
},{error:"object is required"});

export type UserFavouriteSongSchema = z.infer<typeof userFavouriteSongSchema>;
