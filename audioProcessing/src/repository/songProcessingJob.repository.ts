import { type Database } from "../infra";
import { SongProcessingJobSchema, type SongProcessingJob } from "../schema/songProcessingJob.schema";
import { BaseRepository } from "./base.repository";
import { type Logger } from "../observablity";
import { type SignatureUtility } from "../lib/signature";

export type CreateJobData = Omit<SongProcessingJob, "transcodingAttempt" | "transcribingAttempt" | "status">;
export type UpdateJobData = Partial<SongProcessingJob>;

const SELECT_FIELDS = `
    id, job_id AS "jobId", title, artist_name AS "artistName", duration,
    temp_song_key AS "tempSongKey", song_key AS "songKey", image_key AS "imageKey",
    language, sample_rate AS "sampleRate", loudness, dynamic_complexity AS "dynamicComplexity",
    bpm, spectral_centroid AS "spectralCentroid", spectral_flux AS "spectralFlux",
    zero_crossing_rate AS "zeroCrossingRate", transcoding_id AS "transcodingId",
    transcoding_attempt AS "transcodingAttempt", transcribing_id AS "transcribingId",
    transcribing_attempt AS "transcribingAttempt", transcoded, transcribed,
    extracted_features AS "extractedFeatures", saved_in_search AS "savedInSearch",
    saved_in_recommendation AS "savedInRecommendation", status
`;

export class SongProcessingJobRepository extends BaseRepository<SongProcessingJob, CreateJobData, UpdateJobData> {
    constructor(db: Database, logger: Logger, signatureUtility: SignatureUtility) {
        super(db, "song_processing_job", SongProcessingJobSchema, logger, signatureUtility);
    }

    async create(data: CreateJobData): Promise<SongProcessingJob> {
        const id = data.id || this.signatureUtility.generateSignedId();
        const rows = await (this.db as any).query(
            `INSERT INTO song_processing_job (
                id, job_id, title, artist_name, duration, temp_song_key, song_key, image_key, 
                language, sample_rate, loudness, dynamic_complexity, bpm, 
                spectral_centroid, spectral_flux, zero_crossing_rate, 
                saved_in_search, saved_in_recommendation,
                transcoded, transcribed, extracted_features,
                transcoding_id, transcribing_id, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'pending')
            RETURNING ${SELECT_FIELDS}`,
            [
                id,
                data.jobId,
                data.title,
                data.artistName,
                data.duration ?? null,
                data.tempSongKey,
                data.songKey ?? null,
                data.imageKey,
                data.language ?? null,
                data.sampleRate ?? null,
                data.loudness ?? null,
                data.dynamicComplexity ?? null,
                data.bpm ?? null,
                data.spectralCentroid ?? null,
                data.spectralFlux ?? null,
                data.zeroCrossingRate ?? null,
                data.savedInSearch ?? false,
                data.savedInRecommendation ?? false,
                data.transcoded ?? false,
                data.transcribed ?? false,
                data.extractedFeatures ?? false,
                data.transcodingId ?? null,
                data.transcribingId ?? null
            ]
        );
        const row = rows[0];
        if (!row) throw new Error("Failed to create song processing job");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateJobData): Promise<SongProcessingJob> {
        if (!this.signatureUtility.verifyId(id)) {
            throw new Error(`Invalid or tampered ID: ${id}`);
        }
        const rows = await (this.db as any).query(
            `UPDATE song_processing_job
             SET
                title                = COALESCE($1, title),
                artist_name          = COALESCE($2, artist_name),
                duration             = COALESCE($3, duration),
                temp_song_key        = COALESCE($4, temp_song_key),
                song_key             = COALESCE($5, song_key),
                image_key            = COALESCE($6, image_key),
                language             = COALESCE($7, language),
                sample_rate          = COALESCE($8, sample_rate),
                loudness             = COALESCE($9, loudness),
                dynamic_complexity   = COALESCE($10, dynamic_complexity),
                bpm                  = COALESCE($11, bpm),
                spectral_centroid    = COALESCE($12, spectral_centroid),
                spectral_flux        = COALESCE($13, spectral_flux),
                zero_crossing_rate   = COALESCE($14, zero_crossing_rate),
                saved_in_search      = COALESCE($15, saved_in_search),
                saved_in_recommendation = COALESCE($16, saved_in_recommendation),
                transcoded           = COALESCE($17, transcoded),
                transcribed          = COALESCE($18, transcribed),
                extracted_features   = COALESCE($19, extracted_features),
                transcoding_id       = COALESCE($20, transcoding_id),
                transcoding_attempt  = COALESCE($21, transcoding_attempt),
                transcribing_id      = COALESCE($22, transcribing_id),
                transcribing_attempt = COALESCE($23, transcribing_attempt),
                status               = COALESCE($24, status)
             WHERE id = $25
             RETURNING ${SELECT_FIELDS}`,
            [
                data.title ?? null,
                data.artistName ?? null,
                data.duration ?? null,
                data.tempSongKey ?? null,
                data.songKey ?? null,
                data.imageKey ?? null,
                data.language ?? null,
                data.sampleRate ?? null,
                data.loudness ?? null,
                data.dynamicComplexity ?? null,
                data.bpm ?? null,
                data.spectralCentroid ?? null,
                data.spectralFlux ?? null,
                data.zeroCrossingRate ?? null,
                data.savedInSearch ?? null,
                data.savedInRecommendation ?? null,
                data.transcoded ?? null,
                data.transcribed ?? null,
                data.extractedFeatures ?? null,
                data.transcodingId ?? null,
                data.transcodingAttempt ?? null,
                data.transcribingId ?? null,
                data.transcribingAttempt ?? null,
                data.status ?? null,
                id
            ]
        );
        const row = rows[0];
        if (!row) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(row);
    }

    async getByStatus(status: string): Promise<SongProcessingJob[]> {
        const rows = await (this.db as any).query(
            `SELECT ${SELECT_FIELDS} FROM song_processing_job WHERE status = $1`,
            [status]
        );
        return rows.map((row: any) => this.mapRow(row));
    }
}
