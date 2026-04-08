import { z } from "zod";

export const userSearchHistorySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, { message: "userId is required" }),
  searchedText: z.string().min(1, { message: "searchedText is required" }),
});

export type UserSearchHistorySchema = z.infer<typeof userSearchHistorySchema>;
