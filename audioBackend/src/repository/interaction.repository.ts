import type { Database } from "../infra/db";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

export class InteractionRepository extends BaseRepository<SongSchema, any, any> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        // This repository primarily returns Songs (Trending), so we use songSchema
        super(db, "user_histories", songSchema, logger);
        logMethods(this, this.logger);
    }

    async create(): Promise<never> {
        throw new Error("InteractionRepository does not support direct creation - use UserHistory instead");
    }

    async update(): Promise<never> {
        throw new Error("Update not supported");
    }

    async getTrendingSongs(limit: number, offset: number): Promise<SongSchema[]> {
        const rows = await this.db`
            SELECT 
                s.id, s.title, s.artist_name AS "artistName", s.duration,
                s.song_key AS "songKey", s.image_key AS "imageKey",
                s.language, s.job_id AS "jobId", s.created_at AS "createdAt",
                COUNT(h.id) as listen_count
            FROM user_histories h
            JOIN songs s ON h.song_id = s.id
            GROUP BY s.id
            ORDER BY listen_count DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async countTrendingSongs(): Promise<number> {
        const [row] = await this.db`
            SELECT COUNT(DISTINCT song_id)::int as count FROM user_histories
        `;
        return row?.count || 0;
    }
}
