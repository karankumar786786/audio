import { z } from "zod";

import { registry } from "../docs/openapi-registry";

export const CreateSongSchema = z.object({
  title: z.string().min(1, "Title is required").openapi({ description: "Track title", example: "High Rated Gabru" }),
  artistName: z.string().min(1, "Artist name is required").openapi({ description: "Name of the artist", example: "Guru Randhawa" }),
  tempSongKey: z.string().min(1, "Temporary song key is required").openapi({ description: "S3 key for the temporary uploaded file", example: "temp/audio_123.mp3" }),
  imageKey: z.string().min(1, "Image key is required").openapi({ description: "S3 key for the track art", example: "songs/images/gabru.jpg" }),
}).openapi("CreateSongRequest");

export type CreateSongInput = z.infer<typeof CreateSongSchema>;

export const songSchema = z.object({
  id: z.string().openapi({ description: "Song UUID", example: "song_abc123" }),
  title: z.string().min(1, { message: "title is required" }).openapi({ description: "Track title", example: "High Rated Gabru" }),
  artistName: z.string().min(1, { message: "artistName is required" }).openapi({ description: "Primary artist name", example: "Guru Randhawa" }),
  duration: z.number().int().positive().openapi({ description: "Duration in seconds", example: 214 }),
  songKey: z.string().min(1, { message: "songKey is required" }).openapi({ description: "S3 key for the transcoded audio", example: "songs/audio/high-rated-gabru.m4a" }),
  imageKey: z.string().min(1, { message: "imageKey is required" }).openapi({ description: "S3 key for the artwork", example: "songs/images/gabru.jpg" }),
  language: z.string().min(1, { message: "language is required" }).openapi({ description: "Detected/assigned language", example: "pa" }),
  jobId: z.string().openapi({ description: "ID of the processing job that created this song", example: "job_789" }),
  createdAt: z.coerce.string().optional().openapi({ description: "Creation timestamp" }),
}).openapi("Song");
export type SongSchema = z.infer<typeof songSchema>;

export const updateSongSchema = CreateSongSchema.partial().openapi("UpdateSongRequest");
export type UpdateSongInput = z.infer<typeof updateSongSchema>;

// Register definitions
registry.register("Song", songSchema);
registry.register("CreateSongRequest", CreateSongSchema);
registry.register("UpdateSongRequest", updateSongSchema);