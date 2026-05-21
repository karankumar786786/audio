import { type DbClient } from "../db/db.ts";
import { SongProcessingJobSchema, type SongProcessingJob } from "../schema/songProcessingJob.schema.ts";
import { BaseRepository } from "./base.repository.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { songProcessingJob } from "../db/schema.ts";
import { eq } from "drizzle-orm";

type CreateJobData = Omit<SongProcessingJob, "transcodingAttempt" | "transcribingAttempt" | "status">;
type UpdateJobData = Partial<SongProcessingJob>;

export class SongProcessingJobRepository extends BaseRepository<SongProcessingJob, typeof songProcessingJob, CreateJobData, UpdateJobData> {
    constructor(
        db: DbClient,
        logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        super(db, songProcessingJob, SongProcessingJobSchema, logger);
        logMethods(this, this.logger);
    }

    async create(data: CreateJobData): Promise<SongProcessingJob> {
        const id = data.id || this.signatureService.generateSignedId();
        const [row] = await this.db
            .insert(songProcessingJob)
            .values({
                id,
                jobId: data.jobId,
                title: data.title,
                artistName: data.artistName,
                duration: data.duration ?? null,
                tempSongKey: data.tempSongKey,
                songKey: data.songKey ?? null,
                imageKey: data.imageKey,
                language: data.language ?? null,
                sampleRate: data.sampleRate ?? null,
                loudness: data.loudness ?? null,
                dynamicComplexity: data.dynamicComplexity ?? null,
                bpm: data.bpm ?? null,
                spectralCentroid: data.spectralCentroid ?? null,
                spectralFlux: data.spectralFlux ?? null,
                zeroCrossingRate: data.zeroCrossingRate ?? null,
                savedInSearch: data.savedInSearch ?? false,
                savedInRecommendation: data.savedInRecommendation ?? false,
                transcodingId: data.transcodingId ?? null,
                transcodingAttempt: 0,
                transcoded: data.transcoded ?? false,
                transcribingId: data.transcribingId ?? null,
                transcribingAttempt: 0,
                transcribed: data.transcribed ?? false,
                extractedFeatures: data.extractedFeatures ?? false,
                status: "pending"
            })
            .returning();
        if (!row) throw new Error("Failed to create song processing job");
        return this.mapRow(row);
    }

    async update(id: string, data: UpdateJobData): Promise<SongProcessingJob> {
        this.signatureService.verifyId(id, "songId");
        
        const { id: _, jobId: __, ...updateFields } = data;
        
        const [row] = await this.db
            .update(songProcessingJob)
            .set(updateFields)
            .where(eq(songProcessingJob.id, id))
            .returning();
            
        if (!row) throw new Error(`Job with id ${id} not found`);
        return this.mapRow(row);
    }

    async updateStatus(id: string, status: SongProcessingJob["status"]): Promise<SongProcessingJob> {
        return this.update(id, { status });
    }

    async getByStatus(status: string): Promise<SongProcessingJob[]> {
        const rows = await this.db
            .select()
            .from(songProcessingJob)
            .where(eq(songProcessingJob.status, status as any));
        return rows.map((row) => this.mapRow(row));
    }
}
