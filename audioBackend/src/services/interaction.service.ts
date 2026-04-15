import { type UserHistoryRepository } from "../repository/user-history.repository";
import { type InteractionRepository } from "../repository/interaction.repository";
import { type SongRepository } from "../repository/song.repository";
import { type RecommendationService } from "../lib/recommendation";
import { type SignatureService } from "../lib/signature";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";
import type { SongSchema } from "../schema";

export class InteractionService {
    constructor(
        private readonly userHistoryRepository: UserHistoryRepository,
        private readonly interactionRepository: InteractionRepository,
        private readonly songRepository: SongRepository, // Injected songRepository
        private readonly recommendationService: RecommendationService,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async recordListen(userId: string, songId: string, part: number):Promise<void> {
        await this.userHistoryRepository.create({ userId, songId, part: part ?? 100 });
        const portion = Math.min(1, Math.max(0, (part ?? 100) / 100));
        try { await this.recommendationService.addListen(userId, songId, portion); } catch (_) {}
        return ;
    }

    async getTrendingSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset = (params.page - 1) * params.limit;
        
        const [total, trending] = await Promise.all([
            this.interactionRepository.countTrendingSongs(),
            this.interactionRepository.getTrendingSongs(params.limit, offset)
        ]);
        
        return buildPaginatedResult<SongSchema>(trending, total, params);
    }

    async getRecommendations(userId: string, limit: number): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(userId,"userId");
        const recommendations = await this.recommendationService.recommendUser(userId, limit);
        const songIds = recommendations.map(r => r.id).filter((id): id is string => !!id);
        if (songIds.length === 0) return buildPaginatedResult([], 0, { page: 1, limit });
        const songs = await this.songRepository.getByIds(songIds);
        const songMap = new Map(songs.map(s => [s.id, s]));
        const result = songIds.map(id => songMap.get(id)).filter((song): song is SongSchema => !!song);
        return buildPaginatedResult<SongSchema>(result, result.length, { page: 1, limit });
    }
}
