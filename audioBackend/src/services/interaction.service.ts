import { 
    userHistoryRepository, 
    recommendationService,
    db,
    signatureService
} from "../infra";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class InteractionService {
    async recordListen(userId: string, songId: string, part: number) {
        const id = signatureService.generateSignedId();
        const entry = await userHistoryRepository.create({ id, userId, songId, part: part ?? 100 });

        // Sync listen portion with Recombee (part is 0-100, Recombee expects 0-1)
        const portion = Math.min(1, Math.max(0, (part ?? 100) / 100));
        try { await recommendationService.addListen(userId, songId, portion); } catch (_) {}

        return entry;
    }

    async getTrendingSongs(params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        
        // Count total trending songs in the last 7 days
        const [countResult] = await db`
            SELECT COUNT(DISTINCT song_id)::int as count 
            FROM user_history 
            WHERE listened_at >= NOW() - INTERVAL '7 days'
        `;
        const total = countResult?.count || 0;

        const trending = await db`
            SELECT 
                s.id,
                s.title,
                s.artist_name AS "artistName",
                s.duration,
                s.song_key AS "songKey",
                s.image_key AS "imageKey",
                s.language,
                COUNT(uh.id)::int AS "listenCount"
            FROM user_history uh
            JOIN songs s ON s.id = uh.song_id
            WHERE uh.listened_at >= NOW() - INTERVAL '7 days'
            GROUP BY s.id
            ORDER BY "listenCount" DESC
            LIMIT ${params.limit} OFFSET ${offset}
        `;
        
        return buildPaginatedResult(trending, total, params);
    }

    async getRecommendations(userId: string, limit: number) {
        return await recommendationService.recommendUser(userId, limit);
    }
}
