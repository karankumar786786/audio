import type { Database } from "../infra/db";
import { type SongProcessingJob } from "../schema/songProcessingJob.schema";
import { logMethods, type Logger } from "../observability";

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
        const [job] = await this.db`
            SELECT * FROM song_processing_job WHERE id = ${id}
        `;
        if (!job) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async update(id: string, data: UpdateJobData): Promise<SongProcessingJob> {
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
        if (!job) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async delete(id: string): Promise<SongProcessingJob> {
        const [job] = await this.db`
            DELETE FROM song_processing_job WHERE id = ${id} RETURNING *
        `;
        if (!job) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    async getByStatus(status: string): Promise<SongProcessingJob[]> {
        const jobs = await this.db`
            SELECT * FROM song_processing_job WHERE status = ${status}
        `;
        return jobs.map((row) => this.mapRow(row));
    }

    async updateStatus(id: string, status: string, songId?: string): Promise<SongProcessingJob> {
        const [job] = await this.db`
            UPDATE song_processing_job
            SET 
                status = ${status},
                song_id = ${songId ?? null}
            WHERE id = ${id}
            RETURNING *
        `;
        if (!job) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(job);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): SongProcessingJob {
        return {
            id: row.id,
            jobId: row.job_id,
            title: row.title,
            artistName: row.artist_name,
            duration: row.duration,
            tempSongKey: row.temp_song_key,
            songKey: row.song_key,
            imageKey: row.image_key,
            language: row.language,
            sampleRate: row.sample_rate,
            loudness: row.loudness,
            dynamicComplexity: row.dynamic_complexity,
            bpm: row.bpm,
            spectralCentroid: row.spectral_centroid,
            spectralFlux: row.spectral_flux,
            zeroCrossingRate: row.zero_crossing_rate,
            savedInSearch: row.saved_in_search,
            savedInRecommendation: row.saved_in_recommendation,
            transcoded: row.transcoded,
            transcribed: row.transcribed,
            extractedFeatures: row.extracted_features,
            transcodingId: row.transcoding_id,
            transcodingAttempt: row.transcoding_attempt,
            transcribingId: row.transcribing_id,
            transcribingAttempt: row.transcribing_attempt,
            status: row.status,
        };
    }
}
