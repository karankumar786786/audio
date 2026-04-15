import type { Database } from "../infra/db";
import { artistSchema, type ArtistSchema } from "../schema/artist.schema";
import { BaseRepository } from "./base.repository";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

type CreateArtistData = Omit<ArtistSchema, "createdAt">;
type UpdateArtistData = Partial<CreateArtistData>;

export class ArtistRepository extends BaseRepository<ArtistSchema, CreateArtistData, UpdateArtistData> {
    constructor(
        db: Database,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, "artists", artistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateArtistData): Promise<ArtistSchema> {
        const id = this.signatureService.generateSignedId();
        const [artist] = await this.db`
            INSERT INTO artists (id, name, about, dob, cover_image_key, banner_image_key)
            VALUES (
                ${id}, ${data.name}, ${data.about}, ${data.dob}, 
                ${data.coverImageKey}, ${data.bannerImageKey}
            )
            RETURNING 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
        `;
        if (!artist) throw new Error("Failed to create artist");
        return this.mapRow(artist);
    }

    async update(id: string, data: UpdateArtistData): Promise<ArtistSchema> {
        this.signatureService.verifyId(id, "artistId");
        const [artist] = await this.db`
            UPDATE artists
            SET
                name             = COALESCE(${data.name ?? null}, name),
                about            = COALESCE(${data.about ?? null}, about),
                dob              = COALESCE(${data.dob ?? null}, dob),
                cover_image_key  = COALESCE(${data.coverImageKey ?? null}, cover_image_key),
                banner_image_key = COALESCE(${data.bannerImageKey ?? null}, banner_image_key)
            WHERE id = ${id}
            RETURNING 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
        `;
        if (!artist) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(artist);
    }

    async getAll(limit?: number, offset?: number): Promise<ArtistSchema[]> {
        const rows = await this.db`
            SELECT 
                id, name, about, dob, 
                cover_image_key AS "coverImageKey", 
                banner_image_key AS "bannerImageKey", 
                created_at AS "createdAt"
            FROM artists 
            ORDER BY created_at DESC
            LIMIT ${limit ?? null} OFFSET ${offset ?? null}
        `;
        return rows.map((row) => this.mapRow(row));
    }

    override async count(): Promise<number> {
        const [row] = await this.db`SELECT count(*)::int as count FROM artists`;
        return row?.count || 0;
    }
}
