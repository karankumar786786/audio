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
        
        // Build SongSchema objects directly from Recombee values
        const result: SongSchema[] = recommendations.flatMap(r => {
            if (!r.fullId) return [];
            return [{
                id: r.fullId,
                jobId: r.jobId || "",
                createdAt: r.createdAt || new Date().toISOString(),
                title: r.title || "Unknown",
                artistName: r.artistName || "Unknown Artist",
                duration: r.duration || 0,
                songKey: r.songKey || "",
                imageKey: r.imageKey || "",
                language: r.language || "en"
            } as SongSchema];
        });

        this.logger.info(`[InteractionService] Recombee returned ${result.length} song objects for ${userId}: ${result.map(s => s.title).join(', ')}`);

        // If after filtering we have too few results, complement with Trending and then Random
        if (result.length < limit) {
            const combined = [...result];
            this.logger.info(`[InteractionService] Recombee results insufficient (${result.length}/${limit}) for ${userId}. Fetching trending fallback.`);
            
            const trending = await this.getTrendingSongs({ page: 1, limit });
            this.logger.info(`[InteractionService] Trending fallback returned ${trending.data.length} songs.`);

            for (const s of trending.data) {
                if (combined.length >= limit) break;
                if (!combined.some(c => c.id === s.id)) {
                    combined.push(s);
                }
            }

            if (combined.length < limit) {
                this.logger.info(`[InteractionService] Trending results insufficient (${combined.length}/${limit}) for ${userId}. Fetching random fallback.`);
                const randomSongs = await this.songRepository.getRandom(limit);
                this.logger.info(`[InteractionService] Random fallback returned ${randomSongs.length} songs.`);
                for (const s of randomSongs) {
                    if (combined.length >= limit) break;
                    if (!combined.some(c => c.id === s.id)) {
                        combined.push(s);
                    }
                }
            }

            
            this.logger.info(`[InteractionService] Final returned count: ${combined.length}`);
            return buildPaginatedResult<SongSchema>(combined, combined.length, { page: 1, limit });
        }

        return buildPaginatedResult<SongSchema>(result, result.length, { page: 1, limit });
    }
}
