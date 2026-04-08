import { db } from "../infra";
import { type ArtistSchema } from "../schema/artist.schema";
import type { Repository } from "../type/repository.type";

type CreateArtistData = Omit<ArtistSchema, "createdAt">;
type UpdateArtistData = Partial<CreateArtistData>;

export class ArtistRepository implements Repository<ArtistSchema, CreateArtistData, UpdateArtistData> {

    async create(data: CreateArtistData): Promise<ArtistSchema> {
        const [artist] = await db`
            INSERT INTO artists (id, name, about, dob, cover_image_key, banner_image_key)
            VALUES (
                ${data.id},
                ${data.name},
                ${data.about},
                ${data.dob},
                ${data.coverImageKey},
                ${data.bannerImageKey}
            )
            RETURNING *
        `;
        if (!artist) throw new Error("Failed to create artist");
        return this.mapRow(artist);
    }

    async getById(id: string): Promise<ArtistSchema> {
        const [artist] = await db`
            SELECT * FROM artists WHERE id = ${id}
        `;
        if (!artist) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    async getAll(): Promise<ArtistSchema[]> {
        const artists = await db`SELECT * FROM artists ORDER BY created_at DESC`;
        return artists.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdateArtistData): Promise<ArtistSchema> {
        const [artist] = await db`
            UPDATE artists
            SET
                name              = COALESCE(${data.name ?? null}, name),
                about             = COALESCE(${data.about ?? null}, about),
                dob               = COALESCE(${data.dob ?? null}, dob),
                cover_image_key   = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key  = COALESCE(${data.bannerImageKey ?? null}, banner_image_key)
            WHERE id = ${id}
            RETURNING *
        `;
        if (!artist) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    async delete(id: string): Promise<ArtistSchema> {
        const [artist] = await db`
            DELETE FROM artists WHERE id = ${id} RETURNING *
        `;
        if (!artist) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    // Maps DB snake_case row → camelCase ArtistSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRow(row: Record<string, any>): ArtistSchema {
        return {
            id: row.id as string,
            name: row.name as string,
            about: row.about as string,
            dob: (row.dob as Date)?.toISOString(),
            coverImageKey: row.cover_image_key as string,
            bannerImageKey: row.banner_image_key as string,
            createdAt: (row.created_at as Date)?.toISOString(),
        };
    }
}
