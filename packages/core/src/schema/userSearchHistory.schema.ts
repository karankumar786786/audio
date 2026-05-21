import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const userSearchHistorySchema = z.object({
  id: z.string(),
  userId: z.string().min(1, { message: "userId is required" }),
  searchedText: z.string().min(1, { message: "searchedText is required" }),
});

export type UserSearchHistorySchema = z.infer<typeof userSearchHistorySchema>;
