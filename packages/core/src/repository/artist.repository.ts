import { type DbClient } from "../db/db.ts";
import { artistSchema, type ArtistSchema } from "../schema/artist.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { artists } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

type CreateArtistData = Omit<ArtistSchema, "createdAt">;
type UpdateArtistData = Partial<CreateArtistData>;

export class ArtistRepository extends BaseRepository<ArtistSchema, typeof artists, CreateArtistData, UpdateArtistData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, artists, artistSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateArtistData): Promise<ArtistSchema> {
        // If data already contains id, use it, otherwise generate it.
        const id = (data as any).id || this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(artists)
            .values({
                id,
                name: data.name,
                about: data.about,
                dob: new Date(data.dob),
                coverImageKey: data.coverImageKey || "",
                bannerImageKey: data.bannerImageKey || ""
            })
            .returning();
        if (!row) throw new Error("Failed to create artist");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateArtistData): Promise<ArtistSchema> {
        this.signatureService.verifyId(id, "artistId");
        
        const setClause: Partial<typeof artists.$inferInsert> = {};
        if (data.name !== undefined) setClause.name = data.name;
        if (data.about !== undefined) setClause.about = data.about;
        if (data.dob !== undefined) setClause.dob = new Date(data.dob);
        if (data.coverImageKey !== undefined) setClause.coverImageKey = data.coverImageKey;
        if (data.bannerImageKey !== undefined) setClause.bannerImageKey = data.bannerImageKey;

        const [row] = await this.db
            .update(artists)
            .set(setClause)
            .where(eq(artists.id, id))
            .returning();
        if (!row) throw new Error(`Artist with id ${id} not found`);
        return this.mapRow(row);
    }

    async getAll(limit?: number, offset?: number): Promise<ArtistSchema[]> {
        let q = this.db.select().from(artists).orderBy(desc(artists.createdAt)).$dynamic();
        if (limit !== undefined) q = q.limit(limit);
        if (offset !== undefined) q = q.offset(offset);
        const rows = await q;
        return rows.map((row) => this.mapRow(row));
    }
}
