import { randomUUIDv7 } from "bun";
import type { Database } from "../infra/db";
import { userHistorySchema, type UserHistorySchema } from "../schema/userHistory.schema";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import type { SignatureService } from "../lib";

type CreateHistoryData = Omit<UserHistorySchema, "id" | "listenedAt">;

export class UserHistoryRepository extends BaseRepository<UserHistorySchema, CreateHistoryData, any> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService:SignatureService,
    ) {
        super(db, "user_histories", userHistorySchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateHistoryData): Promise<UserHistorySchema> {
        const id:string = this.signatureService.generateSignedId();
        this.signatureService.verifyId(data.songId,"songId");
        this.signatureService.verifyId(data.userId,"userId");
        const [entry] = await this.db`
            INSERT INTO user_histories (id, user_id, song_id, part)
            VALUES (${id}, ${data.userId}, ${data.songId}, ${data.part})
            RETURNING id, user_id AS "userId", song_id AS "songId", part, listened_at AS "listenedAt"
        `;
        if (!entry) throw new Error("Failed to record history");
        return this.mapRow(entry);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for history");
    }

    async getByUserId(userId: string, limit: number, offset: number): Promise<SongSchema[]> {
        const rows = await this.db`
            SELECT 
                s.id,
                s.title,
                s.artist_name AS "artistName",
                s.duration,
                s.song_key AS "songKey",
                s.image_key AS "imageKey",
                s.language,
                s.job_id AS "jobId",
                s.created_at AS "createdAt"
            FROM user_histories uh
            JOIN songs s ON s.id = uh.song_id
            WHERE uh.user_id = ${userId}
            ORDER BY uh.listened_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => songSchema.parse(row));
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await this.db`
            SELECT COUNT(*) AS count
            FROM user_histories
            WHERE user_id = ${userId}
        `;
        return parseInt(row?.count || "0");
    }
}
