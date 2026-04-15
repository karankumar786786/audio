import { randomUUIDv7 } from "bun";
import type { Database } from "../infra/db";
import { userHistorySchema, type UserHistorySchema } from "../schema/userHistory.schema";
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

    async getByUserId(userId: string, limit: number, offset: number): Promise<UserHistorySchema[]> {
        const rows = await this.db`
            SELECT id, user_id AS "userId", song_id AS "songId", part, listened_at AS "listenedAt"
            FROM user_histories
            WHERE user_id = ${userId}
            ORDER BY listened_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
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
