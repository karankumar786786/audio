import { type Database } from "../infra/db";
import { type SongProcessingJob } from "../schema/songProcessingJob.schema";
import { logMethods, type Logger } from "../observablity";
import { NotFoundError } from "../errors";

type CreateJobData = Omit<SongProcessingJob, "transcodingAttempt" | "transcribingAttempt" | "status">;
type UpdateJobData = Partial<SongProcessingJob>;

export class SongProcessingJobRepository {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async create(data: CreateJobData): Promise<SongProcessingJob> {
        this.logger.debug({ data }, "create starting");
        const [job] = await this.db`
            INSERT INTO song_processing_job (
                id, job_id,title, artist_name, duration, temp_song_key, song_key, image_key, 
                language, sample_rate, loudness, dynamic_complexity, bpm, 
                spectral_centroid, spectral_flux, zero_crossing_rate, 
                saved_in_search, saved_in_recommendation,
                transcoded, transcribed, extracted_features,
                transcoding_id, transcribing_id, status
            )
            VALUES (
                ${data.id}, 
                ${data.jobId},
                ${data.title}, 
                ${data.artistName},
                ${data.duration ?? null}, 
                ${data.tempSongKey}, 
                ${data.songKey ?? null}, 
                ${data.imageKey}, 
                ${data.language ?? null}, 
                ${data.sampleRate ?? null}, 
                ${data.loudness ?? null}, 
                ${data.dynamicComplexity ?? null}, 
                ${data.bpm ?? null}, 
                ${data.spectralCentroid ?? null}, 
                ${data.spectralFlux ?? null}, 
                ${data.zeroCrossingRate ?? null}, 
                ${data.savedInSearch ?? false}, 
                ${data.savedInRecommendation ?? false},
                ${data.transcoded ?? false},
                ${data.transcribed ?? false},
                ${data.extractedFeatures ?? false},
                ${data.transcodingId ?? null}, 
                ${data.transcribingId ?? null}, 'pending'
            )
            RETURNING *
        `;
        if (!job) throw new Error("Failed to create song processing job");
        return this.mapRow(job);
    }

    async getById(id: string): Promise<SongProcessingJob> {
        this.logger.debug({ id }, "getById starting");
        const [job] = await this.db`
            SELECT * FROM song_processing_job WHERE id = ${id}
        `;
        if (!job) throw new NotFoundError(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async update(id: string, data: UpdateJobData): Promise<SongProcessingJob> {
        this.logger.debug({ id, data }, "update starting");
        const [job] = await this.db`
            UPDATE song_processing_job
            SET
                title                = COALESCE(${data.title ?? null}, title),
                artist_name          = COALESCE(${data.artistName ?? null}, artist_name),
                duration             = COALESCE(${data.duration ?? null}, duration),
                temp_song_key        = COALESCE(${data.tempSongKey ?? null}, temp_song_key),
                song_key             = COALESCE(${data.songKey ?? null}, song_key),
                image_key            = COALESCE(${data.imageKey ?? null}, image_key),
                language             = COALESCE(${data.language ?? null}, language),
                sample_rate          = COALESCE(${data.sampleRate ?? null}, sample_rate),
                loudness             = COALESCE(${data.loudness ?? null}, loudness),
                dynamic_complexity   = COALESCE(${data.dynamicComplexity ?? null}, dynamic_complexity),
                bpm                  = COALESCE(${data.bpm ?? null}, bpm),
                spectral_centroid    = COALESCE(${data.spectralCentroid ?? null}, spectral_centroid),
                spectral_flux        = COALESCE(${data.spectralFlux ?? null}, spectral_flux),
                zero_crossing_rate   = COALESCE(${data.zeroCrossingRate ?? null}, zero_crossing_rate),
                saved_in_search      = COALESCE(${data.savedInSearch ?? null}, saved_in_search),
                saved_in_recommendation = COALESCE(${data.savedInRecommendation ?? null}, saved_in_recommendation),
                transcoded           = COALESCE(${data.transcoded ?? null}, transcoded),
                transcribed          = COALESCE(${data.transcribed ?? null}, transcribed),
                extracted_features   = COALESCE(${data.extractedFeatures ?? null}, extracted_features),
                transcoding_id       = COALESCE(${data.transcodingId ?? null}, transcoding_id),
                transcoding_attempt  = COALESCE(${data.transcodingAttempt ?? null}, transcoding_attempt),
                transcribing_id      = COALESCE(${data.transcribingId ?? null}, transcribing_id),
                transcribing_attempt = COALESCE(${data.transcribingAttempt ?? null}, transcribing_attempt),
                status               = COALESCE(${data.status ?? null}, status)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!job) throw new NotFoundError(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async delete(id: string): Promise<SongProcessingJob> {
        this.logger.debug({ id }, "delete starting");
        const [job] = await this.db`
            DELETE FROM song_processing_job WHERE id = ${id} RETURNING *
        `;
        if (!job) throw new NotFoundError(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async getByStatus(status: string): Promise<SongProcessingJob[]> {
        this.logger.debug({ status }, "getByStatus starting");
        const jobs = await this.db`
            SELECT * FROM song_processing_job WHERE status = ${status}
        `;
        return jobs.map((row) => this.mapRow(row));
    }

    private mapRow(row: Record<string, unknown>): SongProcessingJob {
        return {
            id: row.id as string,
            jobId: row.job_id as string,
            title: row.title as string,
            artistName: row.artist_name as string,
            duration: row.duration as number,
            tempSongKey: row.temp_song_key as string,
            songKey: row.song_key as string,
            imageKey: row.image_key as string,
            language: row.language as string,
            sampleRate: row.sample_rate as number,
            loudness: row.loudness as number,
            dynamicComplexity: row.dynamic_complexity as number,
            bpm: row.bpm as number,
            spectralCentroid: row.spectral_centroid as number,
            spectralFlux: row.spectral_flux as number,
            zeroCrossingRate: row.zero_crossing_rate as number,
            savedInSearch: row.saved_in_search as boolean,
            savedInRecommendation: row.saved_in_recommendation as boolean,
            transcoded: row.transcoded as boolean,
            transcribed: row.transcribed as boolean,
            extractedFeatures: row.extracted_features as boolean,
            transcodingId: row.transcoding_id as string,
            transcodingAttempt: row.transcoding_attempt as number,
            transcribingId: row.transcribing_id as string,
            transcribingAttempt: row.transcribing_attempt as number,
            status: row.status as SongProcessingJob["status"],
        };
    }
}
