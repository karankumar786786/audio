import type { Database } from "../infra/db";
import { SongProcessingJobSchema, type SongProcessingJob } from "../schema/songProcessingJob.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";

type CreateJobData = Omit<SongProcessingJob, "transcodingAttempt" | "transcribingAttempt" | "status">;
type UpdateJobData = Partial<SongProcessingJob>;

export class SongProcessingJobRepository extends BaseRepository<SongProcessingJob, CreateJobData, UpdateJobData> {
    constructor(
        db: Database,
        logger: Logger
    ) {
        super(db, "song_processing_jobs", SongProcessingJobSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateJobData): Promise<SongProcessingJob> {
        const [job] = await this.db`
            INSERT INTO song_processing_jobs (
                id, job_id, title, artist_name, temp_song_key, image_key,
                transcoded, transcribed, extracted_features, saved_in_search, saved_in_recommendation
            )
            VALUES (
                ${data.id}, ${data.jobId}, ${data.title}, ${data.artistName}, 
                ${data.tempSongKey}, ${data.imageKey},
                ${data.transcoded}, ${data.transcribed}, ${data.extractedFeatures}, 
                ${data.savedInSearch}, ${data.savedInRecommendation}
            )
            RETURNING 
                id, job_id AS "jobId", title, artist_name AS "artistName", 
                duration, temp_song_key AS "tempSongKey", song_key AS "songKey", 
                image_key AS "imageKey", language, sample_rate AS "sampleRate", 
                loudness, dynamic_complexity AS "dynamicComplexity", bpm, 
                spectral_centroid AS "spectralCentroid", spectral_flux AS "spectralFlux", 
                zero_crossing_rate AS "zeroCrossingRate", transcoding_id AS "transcodingId", 
                transcoding_attempt AS "transcodingAttempt", transcribing_id AS "transcribingId", 
                transcribing_attempt AS "transcribingAttempt", transcoded, transcribed, 
                extracted_features AS "extractedFeatures", saved_in_search AS "savedInSearch", 
                saved_in_recommendation AS "savedInRecommendation", status
        `;
        if (!job) throw new Error("Failed to create job");
        return this.mapRow(job);
    }

    async update(id: string, data: UpdateJobData): Promise<SongProcessingJob> {
        const [job] = await this.db`
            UPDATE song_processing_jobs
            SET
                status = COALESCE(${data.status ?? null}, status),
                transcoding_id = COALESCE(${data.transcodingId ?? null}, transcoding_id),
                transcribing_id = COALESCE(${data.transcribingId ?? null}, transcribing_id),
                transcoded = COALESCE(${data.transcoded ?? null}, transcoded),
                transcribed = COALESCE(${data.transcribed ?? null}, transcribed),
                extracted_features = COALESCE(${data.extractedFeatures ?? null}, extracted_features),
                saved_in_search = COALESCE(${data.savedInSearch ?? null}, saved_in_search),
                saved_in_recommendation = COALESCE(${data.savedInRecommendation ?? null}, saved_in_recommendation)
            WHERE id = ${id}
            RETURNING 
                id, job_id AS "jobId", title, artist_name AS "artistName", 
                duration, temp_song_key AS "tempSongKey", song_key AS "songKey", 
                image_key AS "imageKey", language, sample_rate AS "sampleRate", 
                loudness, dynamic_complexity AS "dynamicComplexity", bpm, 
                spectral_centroid AS "spectralCentroid", spectral_flux AS "spectralFlux", 
                zero_crossing_rate AS "zeroCrossingRate", transcoding_id AS "transcodingId", 
                transcoding_attempt AS "transcodingAttempt", transcribing_id AS "transcribingId", 
                transcribing_attempt AS "transcribingAttempt", transcoded, transcribed, 
                extracted_features AS "extractedFeatures", saved_in_search AS "savedInSearch", 
                saved_in_recommendation AS "savedInRecommendation", status
        `;
        if (!job) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async updateStatus(id: string, status: SongProcessingJob["status"]): Promise<SongProcessingJob> {
        return this.update(id, { status });
    }
}
