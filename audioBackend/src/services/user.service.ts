import { type UserRepository } from "../repository/user.repository";
import { type UserFavouriteSongRepository } from "../repository/user-favourite-song.repository";
import { type UserHistoryRepository } from "../repository/user-history.repository";
import { type UserSearchHistoryRepository } from "../repository/user-search-history.repository";
import { type SignatureService } from "../lib/signature";
import type { UserSchema } from "../schema/user.schema";
import { logMethods, type Logger } from "../observability";
import { NotFoundError } from "../errors";

export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly favouriteRepo: UserFavouriteSongRepository,
        private readonly historyRepo: UserHistoryRepository,
        private readonly searchHistoryRepo: UserSearchHistoryRepository,
        private readonly signatureService: SignatureService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async createUser(id: string, email: string): Promise<UserSchema> {
        return await this.userRepository.create({ id, email });
    }

    async getUserById(id: string): Promise<UserSchema> {
        // Repository now auto-throws NotFoundError
        return await this.userRepository.getById(id);
    }

    async getAllUsers(): Promise<UserSchema[]> {
        return await this.userRepository.getAll();
    }

    // Favourites logic
    async addFavourite(userId: string, songId: string) {
        // Repo handles ID generation internally using randomUUIDv7
        return await this.favouriteRepo.create({ userId, songId });
    }

    async removeFavourite(userId: string, songId: string) {
        return await this.favouriteRepo.deleteFavorite(userId, songId);
    }

    async getFavourites(userId: string, limit: number = 20, offset: number = 0) {
        return await this.favouriteRepo.getByUserId(userId, limit, offset);
    }

    // History logic
    async getHistory(userId: string, limit: number = 20, offset: number = 0) {
        return await this.historyRepo.getByUserId(userId, limit, offset);
    }

    // Search History logic
    async getSearchHistory(userId: string, limit: number = 20, offset: number = 0) {
        return await this.searchHistoryRepo.getByUserId(userId, limit, offset);
    }

    async saveSearchHistory(userId: string, text: string) {
        // Repo handles ID generation internally
        return await this.searchHistoryRepo.create({ userId, searchedText: text });
    }

    async clearSearchHistory(userId: string) {
        return await this.searchHistoryRepo.clearByUserId(userId);
    }
}
