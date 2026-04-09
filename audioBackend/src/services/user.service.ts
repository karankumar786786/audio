import { 
    userFavouriteSongRepository, 
    userHistoryRepository, 
    userSearchHistoryRepository,
    recommendationService
} from "../infra";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class UserService {
    // ── Favourites ──────────────────────────────────────────────────────────────

    async addFavourite(userId: string, songId: string, id: string) {
        const entry = await userFavouriteSongRepository.create({ id, userId, songId });
        try { await recommendationService.addFavorite(userId, songId); } catch (_) {}
        return entry;
    }

    async removeFavourite(userId: string, songId: string) {
        const entry = await userFavouriteSongRepository.remove(userId, songId);
        try { await recommendationService.removeFavorite(userId, songId); } catch (_) {}
        return entry;
    }

    async getFavourites(userId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            userFavouriteSongRepository.getByUserId(userId, params.limit, offset),
            userFavouriteSongRepository.countByUserId(userId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    // ── History ─────────────────────────────────────────────────────────────────

    async getHistory(userId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            userHistoryRepository.getByUserId(userId, params.limit, offset),
            userHistoryRepository.countByUserId(userId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    // ── Search History ──────────────────────────────────────────────────────────

    async getSearchHistory(userId: string, params: PaginationParams): Promise<PaginatedResult<any>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            userSearchHistoryRepository.getByUserId(userId, params.limit, offset),
            userSearchHistoryRepository.countByUserId(userId)
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async saveSearchHistory(userId: string, searchedText: string, id: string) {
        return await userSearchHistoryRepository.create({ id, userId, searchedText });
    }

    async clearSearchHistory(userId: string) {
        return await userSearchHistoryRepository.clearUserHistory(userId);
    }
}
