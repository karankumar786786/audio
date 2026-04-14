import {  type Database } from "../infra";
import type { Logger } from "../observablity";
import { type ArtistSchema } from "../schema/artist.schema";
import type { Repository } from "../types/repository.type";
import { NotFoundError } from "../errors";

type CreateArtistData = Omit<ArtistSchema, "createdAt">;
type UpdateArtistData = Partial<CreateArtistData>;

export class ArtistRepository implements Repository<ArtistSchema, CreateArtistData, UpdateArtistData> {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {}

    async create(data: CreateArtistData): Promise<void> {
        const [artist] = await this.db`
            INSERT INTO artists (id, name, about, dob, cover_image_key, banner_image_key)
            VALUES (
                ${data.id},
                ${data.name},
                ${data.about},
                ${data.dob},
                ${data.coverImageKey},
                ${data.bannerImageKey}
            )
            RETURNING id
        `;
        if (!artist) {
            this.logger.error("failed to create artist");
            throw new Error("Failed to create artist")
        };
    }

    async getById(id: string): Promise<ArtistSchema> {
        const [artist] = await this.db`
            SELECT * FROM artists WHERE id = ${id}
        `;
        if (!artist) throw new NotFoundError(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM artists`;
        return row?.count || 0;
    }

    async getAll(limit?: number, offset?: number): Promise<ArtistSchema[]> {
        const artists = await this.db`
            SELECT * FROM artists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return artists.map((row) => this.mapRow(row));
    }

    async update(id: string, data: UpdateArtistData): Promise<void> {
        const [artist] = await this.db`
            UPDATE artists
            SET
                name              = COALESCE(${data.name ?? null}, name),
                about             = COALESCE(${data.about ?? null}, about),
                dob               = COALESCE(${data.dob ?? null}, dob),
                cover_image_key   = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key  = COALESCE(${data.bannerImageKey ?? null}, banner_image_key)
            WHERE id = ${id}
            RETURNING id
        `;
        if (!artist) throw new NotFoundError(`Artist with id ${id} not found`);
    }

    async delete(id: string): Promise<void> {
        const [artist] = await this.db`
            DELETE FROM artists WHERE id = ${id} RETURNING id
        `;
        if (!artist) throw new NotFoundError(`Artist with id ${id} not found`);
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
