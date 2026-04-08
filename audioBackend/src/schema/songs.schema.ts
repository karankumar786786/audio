import { z } from "zod";

export const CreateSongSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artistName: z.string().min(1, "Artist name is required"),
  tempSongKey: z.string().min(1, "Temporary song key is required"),
  imageKey: z.string().min(1, "Image key is required"),
});

export type CreateSongInput = z.infer<typeof CreateSongSchema>;

export const songSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "title is required" }),
  artistName: z.string().min(1, { message: "artistName is required" }),
  duration: z.number().int().positive(),
  songKey: z.string().min(1, { message: "songKey is required" }),
  imageKey: z.string().min(1, { message: "imageKey is required" }),
  language: z.string().min(1, { message: "language is required" }),
  jobId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export type SongSchema = z.infer<typeof songSchema>;
