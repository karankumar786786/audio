import { type Request, type Response, type NextFunction } from "express";
import {
    userHistoryRepository,
    recommendationService,
    db,
    signatureService,
} from "../infra";
import { ApiResponse } from "../utils/ApiResponse";

// record a listen event (stores in history + syncs with Recombee)
export async function addListen(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, songId, part } = req.body;
        const id = signatureService.generateSignedId();
        const entry = await userHistoryRepository.create({ id, userId, songId, part: part ?? 100 });

        // Sync listen portion with Recombee (part is 0-100, Recombee expects 0-1)
        const portion = Math.min(1, Math.max(0, (part ?? 100) / 100));
        try { await recommendationService.addListen(userId, songId, portion); } catch (_) {}

        return res.status(201).json(new ApiResponse(201, "Listen recorded", entry));
    } catch (error: any) {
        next(error);
    }
}

// get trending songs (most listened in the last 7 days)
export async function getTrendingSongs(_req: Request, res: Response, next: NextFunction) {
    try {
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
            LIMIT 50
        `;
        return res.status(200).json(new ApiResponse(200, "Trending songs fetched", trending));
    } catch (error: any) {
        next(error);
    }
}

// get personalized recommendations from Recombee
export async function getRecommendedSongs(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const recommendations = await recommendationService.recommendUser(userId, limit);
        return res.status(200).json(new ApiResponse(200, "Recommendations fetched", recommendations));
    } catch (error: any) {
        next(error);
    }
}
