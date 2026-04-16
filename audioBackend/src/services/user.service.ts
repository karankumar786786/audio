import { type UserPlaylistRepository } from "../repository/user-playlist.repository";
import { type RecommendationService } from "../lib/recommendation";
import { type SignatureService } from "../lib/signature";
import type { UserInfo, UserSchema } from "../schema/user.schema";
import { type UserPlaylistSchema, type UserPlaylistSongSchema } from "../schema/userPlaylist.schema";
import { logMethods, type Logger } from "../observability";
import axios from "axios";
import axiosRetry from "axios-retry";
import { NotFoundError } from "../errors";
import type { JWTService } from "../lib";
import type { Payload, SongSchema, UserFavouriteSongSchema, UserSearchHistorySchema } from "../schema";
import { buildPaginatedResult, type PaginatedResult } from "../type/pagination.type";
import type { UserFavouriteSongRepository, UserHistoryRepository, UserRepository, UserSearchHistoryRepository } from "../repository";


axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
})


export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly favouriteRepo: UserFavouriteSongRepository,
        private readonly historyRepo: UserHistoryRepository,
        private readonly searchHistoryRepo: UserSearchHistoryRepository,
        private readonly userPlaylistRepo: UserPlaylistRepository,
        private readonly recommendationService: RecommendationService,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger,
        private readonly jwtService: JWTService
    ) {
        logMethods(this, this.logger);
    }

    async createUser(accessToken: string): Promise<{ payload: Payload, token: string }> {
        const { data: userInfo } = await axios.get<UserInfo>(`https://${process.env.AUTH0_DOMAIN}/userinfo`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!userInfo.email) {
            throw new NotFoundError("email not found");
        };
        const email = userInfo.email;
        let user = await this.userRepository.getByEmail(email);
        if (!user) {
            user = await this.userRepository.create({ email });
        }
        const payload: Payload = {
            id: user.id,
            userName: userInfo.name ? userInfo.name : "",
            email: email,
            picture: userInfo.picture ? userInfo.picture : "",
        };
        const token = await this.jwtService.sign(payload);
        return {
            payload,
            token
        }
    }

    async getUserById(id: string): Promise<UserSchema> {
        // Repository now auto-throws NotFoundError
        this.signatureService.verifyId(id, "userId");
        return await this.userRepository.getById(id);
    }


    // Favourites logic
    async addFavourite(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        this.signatureService.verifyId(userId, "userId");
        this.signatureService.verifyId(songId, "songId");
        const entry = await this.favouriteRepo.create({ userId, songId });
        try { await this.recommendationService.addFavorite(userId, songId); } catch (_) {}
        return entry;
    }

    async removeFavourite(userId: string, songId: string): Promise<UserFavouriteSongSchema> {
        this.signatureService.verifyId(userId, "userId");
        this.signatureService.verifyId(songId, "songId");
        const entry = await this.favouriteRepo.deleteFavorite(userId, songId);
        try { await this.recommendationService.removeFavorite(userId, songId); } catch (_) {}
        return entry;
    }

    async getFavourites(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(userId, "userId");
        const page = Math.floor(offset / limit) + 1;
        const [data, total] = await Promise.all([
            this.favouriteRepo.getByUserId(userId, limit, offset),
            this.favouriteRepo.countByUserId(userId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, { page, limit });
    }

    // History logic
    async getHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(userId, "userId");
        const page = Math.floor(offset / limit) + 1;
        const [data, total] = await Promise.all([
            this.historyRepo.getByUserId(userId, limit, offset),
            this.historyRepo.countByUserId(userId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, { page, limit });
    }

    // Search History logic
    async getSearchHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResult<UserSearchHistorySchema>> {
        this.signatureService.verifyId(userId, "userId");
        const page = Math.floor(offset / limit) + 1;
        const [data, total] = await Promise.all([
            this.searchHistoryRepo.getByUserId(userId, limit, offset),
            this.searchHistoryRepo.countByUserId(userId)
        ]);
        return buildPaginatedResult<UserSearchHistorySchema>(data, total, { page, limit });
    }

    async saveSearchHistory(userId: string, text: string): Promise<void> {
        this.signatureService.verifyId(userId, "userId");
        await this.searchHistoryRepo.create({ userId, searchedText: text });
        return;
    }

    async clearSearchHistory(userId: string): Promise<void> {
        this.signatureService.verifyId(userId, "userId");
        await this.searchHistoryRepo.clearByUserId(userId);
        return;
    }

    // Playlist logic
    async createUserPlaylist(data: Omit<UserPlaylistSchema, "id">): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(data.userId, "userId");
        return await this.userPlaylistRepo.create(data);
    }

    async getUserPlaylistById(id: string): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        return await this.userPlaylistRepo.getById(id);
    }

    async getUserPlaylists(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResult<UserPlaylistSchema>> {
        this.signatureService.verifyId(userId, "userId");
        const page = Math.floor(offset / limit) + 1;
        const [data, total] = await Promise.all([
            this.userPlaylistRepo.getByUserId(userId, limit, offset),
            this.userPlaylistRepo.countByUserId(userId)
        ]);
        return buildPaginatedResult<UserPlaylistSchema>(data, total, { page, limit });
    }

    async addSongToUserPlaylist(playlistId: string, songId: string, userId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(userId, "userId");
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        return await this.userPlaylistRepo.addSong(playlistId, songId);
    }

    async removeSongFromUserPlaylist(playlistId: string, songId: string, userId: string): Promise<UserPlaylistSongSchema> {
        this.signatureService.verifyId(userId, "userId");
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        this.signatureService.verifyId(songId, "songId");
        return await this.userPlaylistRepo.removeSong(playlistId, songId);
    }

    async getUserPlaylistSongs(playlistId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(playlistId, "userPlaylistId");
        const page = Math.floor(offset / limit) + 1;
        const [data, total] = await Promise.all([
            this.userPlaylistRepo.getSongs(playlistId, limit, offset),
            this.userPlaylistRepo.countSongs(playlistId)
        ]);
        return buildPaginatedResult<SongSchema>(data, total, { page, limit });
    }

    async deleteUserPlaylist(id: string): Promise<UserPlaylistSchema> {
        this.signatureService.verifyId(id, "userPlaylistId");
        return await this.userPlaylistRepo.delete(id);
    }

}
