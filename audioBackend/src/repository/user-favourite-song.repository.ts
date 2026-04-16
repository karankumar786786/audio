import { randomUUIDv7 } from "bun";
import type { Database } from "../infra/db";
import { userFavouriteSongSchema, type UserFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { songSchema, type SongSchema } from "../schema/songs.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import type { SignatureService } from "../lib";

type CreateFavData = Omit<UserFavouriteSongSchema, "id">;

export class UserFavouriteSongRepository extends BaseRepository<UserFavouriteSongSchema, CreateFavData, any> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService:SignatureService
    ) {
        super(db, "user_favourite_songs", userFavouriteSongSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateFavData): Promise<UserFavouriteSongSchema> {
        const id:string = this.signatureService.generateSignedId();
        const [entry] = await this.db`
            INSERT INTO user_favourite_songs (id, user_id, song_id)
            VALUES (${id}, ${data.userId}, ${data.songId})
            ON CONFLICT (user_id, song_id) DO NOTHING
            RETURNING id, user_id AS "userId", song_id AS "songId"
        `;
        if (!entry) throw new Error("Already favourited or failed to create");
        return this.mapRow(entry);
    }

    async update(): Promise<never> {
        throw new Error("Update not supported for favourites");
    }

    async getByUserAndSong(userId: string, songId: string): Promise<UserFavouriteSongSchema | null> {
        const [entry] = await this.db`
            SELECT id, user_id AS "userId", song_id AS "songId"
            FROM user_favourite_songs
            WHERE user_id = ${userId} AND song_id = ${songId}
        `;
        return entry ? this.mapRow(entry) : null;
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
            FROM user_favourite_songs ufs
            JOIN songs s ON s.id = ufs.song_id
            WHERE ufs.user_id = ${userId}
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => songSchema.parse(row));
    }

    async deleteFavorite(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        this.signatureService.verifyId(userId,"userId");
        this.signatureService.verifyId(songId,"songId");
        const [entry] = await this.db`
            DELETE FROM user_favourite_songs
            WHERE user_id = ${userId} AND song_id = ${songId}
            RETURNING id, user_id AS "userId", song_id AS "songId"
        `;
        if (!entry) throw new Error("Favourite not found");
        return this.mapRow(entry);
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await this.db`
            SELECT COUNT(*) AS count
            FROM user_favourite_songs
            WHERE user_id = ${userId}
        `;
        return parseInt(row?.count || "0");
    }
}
