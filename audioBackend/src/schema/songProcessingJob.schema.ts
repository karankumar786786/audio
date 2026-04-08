import { z } from "zod";

export const SongProcessingJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

export const SongProcessingJobSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  title: z.string().min(1, "Title is required"),
  artistName: z.string().min(1, "Artist name is required"),
  duration: z.number().optional().nullable(),
  tempSongKey: z.string().min(1, "Temporary song key is required"),
  songKey: z.string().optional().nullable(),
  imageKey: z.string().min(1, "Image key is required"),
  language: z.string().optional().nullable(),
  sampleRate: z.number().optional().nullable(),
  loudness: z.number().optional().nullable(),
  dynamicComplexity: z.number().optional().nullable(),
  bpm: z.number().optional().nullable(),
  spectralCentroid: z.number().optional().nullable(),
  spectralFlux: z.number().optional().nullable(),
  zeroCrossingRate: z.number().optional().nullable(),
  transcodingId: z.string().optional().nullable(),
  transcodingAttempt: z.number().default(0),
  transcribingId: z.string().optional().nullable(),
  transcribingAttempt: z.number().default(0),
  transcoded: z.boolean().default(false),
  transcribed: z.boolean().default(false),
  extractedFeatures: z.boolean().default(false),
  savedInSearch: z.boolean().default(false),
  savedInRecommendation: z.boolean().default(false),
  status: SongProcessingJobStatusSchema.default('pending'),
});

export type SongProcessingJob = z.infer<typeof SongProcessingJobSchema>;
