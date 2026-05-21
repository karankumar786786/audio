import type { UserHistoryRepository } from "../repository/user-history.repository.ts";
import type { InteractionRepository } from "../repository/interaction.repository.ts";
import type { SongRepository } from "../repository/song.repository.ts";
import type { RecommendationService, RecommendationSchema } from "../infra/recommendation.types.ts";
import type { SignatureService } from "../infra/signature.types.ts";
import { type PaginationParams, type PaginatedResult, buildPaginatedResult } from "../types/pagination.ts";
import { logMethods, type Logger } from "../utils/index.ts";
import type { SongSchema } from "../schema/songs.schema.ts";

export class InteractionService {
    constructor(
        private readonly userHistoryRepository: UserHistoryRepository,
        private readonly interactionRepository: InteractionRepository,
        private readonly songRepository: SongRepository,
        private readonly recommendationService: RecommendationService<RecommendationSchema>,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async recordListen(userId: string, songId: string, part: number): Promise<void> {
        await this.userHistoryRepository.create({ userId, songId, part: part ?? 100 });
        const portion = Math.min(1, Math.max(0, (part ?? 100) / 100));
        try { await this.recommendationService.addListen(userId, songId, portion); } catch (_) {}
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

        if (result.length < limit) {
            const combined = [...result];
            this.logger.info(`[InteractionService] Recombee results insufficient (${result.length}/${limit}). Fetching MINIMAL (limit 2) trending fallback.`);
            
            const trending = await this.interactionRepository.getTrendingSongs(2, 0);
            
            for (const s of trending) {
                if (combined.length >= limit) break;
                if (!combined.some(c => c.id === s.id)) {
                    combined.push(s);
                }
            }

            this.logger.info(`[InteractionService] Final returned count with minimal fallback: ${combined.length}`);
            return buildPaginatedResult<SongSchema>(combined, combined.length, { page: 1, limit });
        }

        return buildPaginatedResult<SongSchema>(result, result.length, { page: 1, limit });
    }
}
