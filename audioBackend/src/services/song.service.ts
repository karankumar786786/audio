import { type SongRepository } from "../repository/song.repository";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";
import type { SignatureService } from "../lib";

export class SongService {
    constructor(
        private readonly songRepository: SongRepository,
        private readonly logger: Logger,
        private readonly signatureService:SignatureService
    ) {
        logMethods(this, this.logger);
    }

    async getSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.songRepository.getAll(params.limit, offset),
            this.songRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }

    async getSongById(id: string): Promise<SongSchema> {
        this.signatureService.verifyId(id,"songId");
        return await this.songRepository.getById(id);
    }
}
