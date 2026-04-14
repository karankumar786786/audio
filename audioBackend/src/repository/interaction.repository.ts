import type { Database } from "../infra/db";
import { logMethods, type Logger } from "../observability";

export class InteractionRepository {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async getTrendingSongsCount(days: number = 7): Promise<number> {
        const [countResult] = await this.db`
            SELECT COUNT(DISTINCT song_id)::int as count 
            FROM user_history 
            WHERE listened_at >= NOW() - INTERVAL '1 day' * ${days}
        `;
        return countResult?.count || 0;
    }

    async getTrendingSongs(limit: number, offset: number, days: number = 7): Promise<any[]> {
        const trending = await this.db`
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
            WHERE uh.listened_at >= NOW() - INTERVAL '1 day' * ${days}
            GROUP BY s.id
            ORDER BY "listenCount" DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        return trending;
    }

    async getSongsByIds(songIds: string[]): Promise<any[]> {
        if (songIds.length === 0) return [];
        return await this.db`
            SELECT 
                id,
                title,
                artist_name AS "artistName",
                duration,
                song_key AS "songKey",
                image_key AS "imageKey",
                language,
                job_id AS "jobId",
                created_at AS "createdAt"
            FROM songs
            WHERE id = ANY(${songIds})
        `;
    }
}
