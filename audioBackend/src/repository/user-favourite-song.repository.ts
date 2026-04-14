import { randomUUIDv7 } from "bun";
import type { Database } from "../infra/db";
import { userFavouriteSongSchema, type UserFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";

type CreateFavData = Omit<UserFavouriteSongSchema, "id">;

export class UserFavouriteSongRepository extends BaseRepository<UserFavouriteSongSchema, CreateFavData, any> {
    constructor(
        db: Database,
        logger: Logger
    ) {
        super(db, "user_favourite_songs", userFavouriteSongSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateFavData): Promise<UserFavouriteSongSchema> {
        const id = randomUUIDv7();
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

    async getByUserId(userId: string, limit: number, offset: number): Promise<UserFavouriteSongSchema[]> {
        const rows = await this.db`
            SELECT id, user_id AS "userId", song_id AS "songId"
            FROM user_favourite_songs
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    async deleteFavorite(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        const [entry] = await this.db`
            DELETE FROM user_favourite_songs
            WHERE user_id = ${userId} AND song_id = ${songId}
            RETURNING id, user_id AS "userId", song_id AS "songId"
        `;
        if (!entry) throw new Error("Favourite not found");
        return this.mapRow(entry);
    }
}
