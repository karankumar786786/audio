import { db } from "../infra";
import { type UserFavouriteSongSchema } from "../schema/userFavouriteSong.schema";
import type { Repository } from "../type/repository.type";



type UpdateFavouriteData = Partial<UserFavouriteSongSchema>;

export class UserFavouriteSongRepository implements Repository<UserFavouriteSongSchema, UserFavouriteSongSchema, UpdateFavouriteData> {

    async create(data: UserFavouriteSongSchema): Promise<UserFavouriteSongSchema> {
        const [entry] = await db`
            INSERT INTO user_favourite_songs (id, user_id, song_id)
            VALUES (${data.id}, ${data.userId}, ${data.songId})
            ON CONFLICT (user_id, song_id) DO NOTHING
            RETURNING *
        `;
        if (!entry) throw new Error("Song already exists in favourites");
        return this.mapRow(entry);
    }

    async getById(id: string): Promise<UserFavouriteSongSchema> {
        const [entry] = await db`
            SELECT * FROM user_favourite_songs WHERE id = ${id}
        `;
        if (!entry) throw new Error(`Favourite entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    async countByUserId(userId: string): Promise<number> {
        const [row] = await db`
            SELECT count(*)::int as count FROM user_favourite_songs WHERE user_id = ${userId}
        `;
        return row?.count || 0;
    }

    async getByUserId(userId: string, limit?: number, offset?: number): Promise<any[]> {
        const rows = await db`
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
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows;
    }

    async getAll(): Promise<UserFavouriteSongSchema[]> {
        const rows = await db`SELECT * FROM user_favourite_songs`;
        return rows.map((row) => this.mapRow(row));
    }

    async update(id: string, _data: UpdateFavouriteData): Promise<UserFavouriteSongSchema> {
        // Updates are generally not applicable for favorites (id-userId-songId are immutable)
        return this.getById(id);
    }

    async delete(id: string): Promise<UserFavouriteSongSchema> {
        const [entry] = await db`
            DELETE FROM user_favourite_songs WHERE id = ${id} RETURNING *
        `;
        if (!entry) throw new Error(`Favourite entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    async remove(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        const [entry] = await db`
            DELETE FROM user_favourite_songs 
            WHERE user_id = ${userId} AND song_id = ${songId} 
            RETURNING *
        `;
        if (!entry) throw new Error("Favourite entry not found");
        return this.mapRow(entry);
    }

    // Maps DB snake_case row → camelCase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): UserFavouriteSongSchema {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            songId: row.song_id as string,
        };
    }
}
