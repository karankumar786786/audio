import { z } from "zod";

export const userSearchHistorySchema = z.object({
  id: z.string(),
  userId: z.string({error:"userId is required"}).min(1, { message: "userId is required" }),
  searchedText: z.string({error:"searchedText text is required"}).min(1, { message: "searchedText is required" }),
},{error:"object is required"});

export type UserSearchHistorySchema = z.infer<typeof userSearchHistorySchema>;
