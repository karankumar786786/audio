import { type Database } from "../infra";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { type Logger } from "../observablity";
import { type SignatureUtility } from "../lib/signature";

export type CreateSongData = Omit<SongSchema, "createdAt">;
export type UpdateSongData = Partial<Omit<CreateSongData, "songKey" | "language" | "jobId" | "duration">>;

export class SongRepository extends BaseRepository<SongSchema, CreateSongData, UpdateSongData> {
    constructor(db: Database, logger: Logger, signatureUtility: SignatureUtility) {
        super(db, "songs", songSchema, logger, signatureUtility);
    }

    async create(data: CreateSongData): Promise<SongSchema> {
        const id = data.id || this.signatureUtility.generateSignedId();
        const rows = await (this.db as any)(
            `INSERT INTO songs (id, title, artist_name, duration, song_key, image_key, language, job_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, title, artist_name AS "artistName", duration, song_key AS "songKey", image_key AS "imageKey", language, job_id AS "jobId", created_at AS "createdAt"`,
            [
                id,
                data.title,
                data.artistName,
                data.duration,
                data.songKey,
                data.imageKey,
                data.language,
                data.jobId
            ]
        );
        const row = rows[0];
        if (!row) throw new Error("Failed to create song");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateSongData): Promise<SongSchema> {
        if (!this.signatureUtility.verifyId(id)) {
            throw new Error(`Invalid or tampered ID: ${id}`);
        }
        const rows = await (this.db as any)(
            `UPDATE songs
             SET
                title       = COALESCE($1, title),
                artist_name = COALESCE($2, artist_name),
                image_key   = COALESCE($3, image_key)
             WHERE id = $4
             RETURNING id, title, artist_name AS "artistName", duration, song_key AS "songKey", image_key AS "imageKey", language, job_id AS "jobId", created_at AS "createdAt"`,
            [
                data.title ?? null,
                data.artistName ?? null,
                data.imageKey ?? null,
                id
            ]
        );
        const row = rows[0];
        if (!row) throw new Error(`Song with id ${id} not found`);
        return this.mapRow(row);
    }

    async getAll(limit?: number, offset?: number): Promise<SongSchema[]> {
        return this.getAllInternal(limit, offset);
    }
}