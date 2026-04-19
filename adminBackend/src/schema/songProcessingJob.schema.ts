import { z } from "zod";

import { registry } from "../docs/openapi-registry";

export const SongProcessingJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'importing']).openapi("JobStatus");

export const SongProcessingJobSchema = z.object({
  id: z.string().openapi({ description: "Track ID", example: "track_123" }),
  jobId: z.string().openapi({ description: "Processing job UUID", example: "job_456" }),
  title: z.string().min(1, "Title is required").openapi({ description: "Track title", example: "High Rated Gabru" }),
  artistName: z.string().min(1, "Artist name is required").openapi({ description: "Artist name", example: "Guru Randhawa" }),
  duration: z.number().optional().nullable().openapi({ description: "Duration in seconds", example: 214 }),
  tempSongKey: z.string().openapi({ description: "S3 key for raw upload", example: "temp/123.mp3" }),
  songKey: z.string().optional().nullable().openapi({ description: "S3 key for finished audio", example: "songs/audio/123.m4a" }),
  imageKey: z.string().openapi({ description: "S3 key for artwork", example: "songs/images/123.jpg" }),
  language: z.string().optional().nullable().openapi({ description: "Detected language code", example: "pa" }),
  sampleRate: z.number().optional().nullable().openapi({ description: "Audio sample rate", example: 44100 }),
  loudness: z.number().optional().nullable().openapi({ description: "Integrated loudness (LUFS)", example: -12.5 }),
  dynamicComplexity: z.number().optional().nullable().openapi({ description: "Dynamic complexity score", example: 0.82 }),
  bpm: z.number().optional().nullable().openapi({ description: "Beats per minute", example: 120 }),
  spectralCentroid: z.number().optional().nullable().openapi({ description: "Spectral centroid (Hz)", example: 2500 }),
  spectralFlux: z.number().optional().nullable().openapi({ description: "Spectral flux", example: 0.15 }),
  zeroCrossingRate: z.number().optional().nullable().openapi({ description: "Zero crossing rate", example: 0.05 }),
  transcodingId: z.string().optional().nullable().openapi({ description: "External transcoding task ID" }),
  transcodingAttempt: z.number().default(0).openapi({ description: "Number of transcode attempts" }),
  transcribingId: z.string().optional().nullable().openapi({ description: "External transcription task ID" }),
  transcribingAttempt: z.number().default(0).openapi({ description: "Number of transcription attempts" }),
  transcoded: z.boolean().default(false).openapi({ description: "Is audio transcoding finished?" }),
  transcribed: z.boolean().default(false).openapi({ description: "Is transcription finished?" }),
  extractedFeatures: z.boolean().default(false).openapi({ description: "Are audio features extracted?" }),
  savedInSearch: z.boolean().default(false).openapi({ description: "Is indexed in search engine?" }),
  savedInRecommendation: z.boolean().default(false).openapi({ description: "Is indexed in recommendation engine?" }),
  status: SongProcessingJobStatusSchema.default('pending').openapi({ description: "Current lifecycle status of the job" }),
}).openapi("SongProcessingJob");

export type SongProcessingJob = z.infer<typeof SongProcessingJobSchema>;

// Register definitions
registry.register("SongProcessingJob", SongProcessingJobSchema);
registry.register("JobStatus", SongProcessingJobStatusSchema);

