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
        this.signatureService.verifyId(userId, "userId");
        const recommendations = await this.recommendationService.recommendUser(userId, limit);
        let songIds = recommendations.map(r => r.id).filter((id): id is string => !!id);

        // Fallback to Trending if Recombee has no data (Cold Start)
        if (songIds.length === 0) {
            this.logger.info(`[InteractionService] No recommendations for ${userId}, falling back to Trending.`);
            const trending = await this.interactionRepository.getTrendingSongs(limit, 0);
            return buildPaginatedResult<SongSchema>(trending, trending.length, { page: 1, limit });
        }

        const songs = await this.songRepository.getByIds(songIds);
        const songMap = new Map(songs.map(s => [s.id, s]));
        const result = songIds.map(id => songMap.get(id)).filter((song): song is SongSchema => !!song);

        // If after filtering we have too few results, complement with Trending (shuffled for variety)
        if (result.length < limit) {
            const trending = await this.interactionRepository.getTrendingSongs(limit * 2, 0);
            const shuffledTrending = trending.sort(() => Math.random() - 0.5);
            for (const t of shuffledTrending) {
                if (result.length >= limit) break;
                if (!result.find(r => r.id === t.id)) result.push(t);
            }
        }

        return buildPaginatedResult<SongSchema>(result, result.length, { page: 1, limit });
    }
}
