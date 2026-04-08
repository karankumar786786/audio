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
        // If conflict occurs, the entry will be undefined. We can either return the existing or throw.
        // For simplicity, if it fails to return (e.g. conflict), we try to fetch it.
        if (!entry) {
            const [existing] = await db`
                SELECT * FROM user_favourite_songs 
                WHERE user_id = ${data.userId} AND song_id = ${data.songId}
            `;
            if (!existing) throw new Error("Failed to create or retrieve favourite entry");
            return this.mapRow(existing);
        }
        return this.mapRow(entry);
    }

    async getById(id: string): Promise<UserFavouriteSongSchema> {
        const [entry] = await db`
            SELECT * FROM user_favourite_songs WHERE id = ${id}
        `;
        if (!entry) throw new Error(`Favourite entry with id ${id} not found`);
        return this.mapRow(entry);
    }

    async getByUserId(userId: string): Promise<UserFavouriteSongSchema[]> {
        const rows = await db`
            SELECT * FROM user_favourite_songs WHERE user_id = ${userId}
        `;
        return rows.map((row) => this.mapRow(row));
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
