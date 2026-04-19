import { type UserHistoryRepository } from "../repository/user-history.repository";
import { type InteractionRepository } from "../repository/interaction.repository";
import { type SongRepository } from "../repository/song.repository";
import { type RecommendationSchema, type RecommendationService } from "../lib/recommendation";
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
        const songIds: string[] = [];
        for (const r of recommendations) {
            if (r.id && typeof r.id === "string") {
                songIds.push(r.id.split(".")[0]!);
            } 
        }
        
        this.logger.info(`[InteractionService] Recombee returned ${songIds.length} IDs for ${userId}: ${JSON.stringify(songIds)}`);

        if (songIds.length === 0) {
            this.logger.info(`[InteractionService] Zero recommendations from Recombee for ${userId}, falling back to Trending.`);
            return this.getTrendingSongs({ page: 1, limit });
        }

        // Use getByBaseIds because Recombee returns raw UUIDs, but DB has uuid.signature
        const songs = await this.songRepository.getByBaseIds(songIds as string[]);
        this.logger.info(`[InteractionService] Found ${songs.length} / ${songIds.length} songs in DB for recommendations.`);

        const songMap = new Map<string, SongSchema>(songs.map(s => [s.id.split('.')[0] as string, s]));
        const result = (songIds as string[]).map(id => songMap.get(id)).filter((song): song is SongSchema => !!song);

        // If after filtering we have too few results, complement with Trending
        if (result.length < limit) {
            const trending = await this.getTrendingSongs({ page: 1, limit });
            const combined = [...result];
            for (const s of trending.data) {
                if (combined.length >= limit) break;
                if (!combined.some(c => c.id === s.id)) {
                    combined.push(s);
                }
            }
            return buildPaginatedResult<SongSchema>(combined, combined.length, { page: 1, limit });
        }

        return buildPaginatedResult<SongSchema>(result, result.length, { page: 1, limit });
    }
}
