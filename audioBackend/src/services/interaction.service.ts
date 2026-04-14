import { type UserHistoryRepository } from "../repository/user-history.repository";
import { type InteractionRepository } from "../repository/interaction.repository";
import { type RecommendationService } from "../lib/recommendation";
import { type SignatureService } from "../lib/signature";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";

export class InteractionService {
    constructor(
        private readonly userHistoryRepository: UserHistoryRepository,
        private readonly interactionRepository: InteractionRepository,
        private readonly recommendationService: RecommendationService,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async recordListen(userId: string, songId: string, part: number) {
        const id = this.signatureService.generateSignedId();
        const entry = await this.userHistoryRepository.create({ id, userId, songId, part: part ?? 100 });

        // Sync listen portion with Recombee (part is 0-100, Recombee expects 0-1)
        const portion = Math.min(1, Math.max(0, (part ?? 100) / 100));
        try { await this.recommendationService.addListen(userId, songId, portion); } catch (_) {}

        return entry;
    }

    async getTrendingSongs(params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        
        const [total, trending] = await Promise.all([
            this.interactionRepository.getTrendingSongsCount(7),
            this.interactionRepository.getTrendingSongs(params.limit, offset, 7)
        ]);
        
        return buildPaginatedResult(trending, total, params);
    }

    async getRecommendations(userId: string, limit: number): Promise<PaginatedResult<any>> {
        const recommendations = await this.recommendationService.recommendUser(userId, limit);
        const songIds = recommendations.map(r => r.id).filter((id): id is string => !!id);
        
        if (songIds.length === 0) return buildPaginatedResult([], 0, { page: 1, limit });

        const songs = await this.interactionRepository.getSongsByIds(songIds);

        // Re-order songs to match Recombee's ranking
        const songMap = new Map(songs.map(s => [s.id, s]));
        const result = songIds.map(id => songMap.get(id)).filter(Boolean);
        
        return buildPaginatedResult(result, result.length, { page: 1, limit });
    }
}
