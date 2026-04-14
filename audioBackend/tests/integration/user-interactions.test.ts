import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../../src/services/user.service";
import { UserRepository } from "../../src/repository/user.repository";
import { UserFavouriteSongRepository } from "../../src/repository/user-favourite-song.repository";
import { UserHistoryRepository } from "../../src/repository/user-history.repository";
import { UserSearchHistoryRepository } from "../../src/repository/user-search-history.repository";
import { NodeCryptoSignatureService } from "../../src/lib/signature";

describe("User Interactions Integration", () => {
    let userService: UserService;
    let userRepo: UserRepository;
    let favRepo: UserFavouriteSongRepository;
    let histRepo: UserHistoryRepository;
    let searchHistRepo: UserSearchHistoryRepository;
    let sigService: NodeCryptoSignatureService;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        
        userRepo = new UserRepository(mockDb, mockLogger);
        favRepo = new UserFavouriteSongRepository(mockDb, mockLogger);
        histRepo = new UserHistoryRepository(mockDb, mockLogger);
        searchHistRepo = new UserSearchHistoryRepository(mockDb, mockLogger);
        sigService = new NodeCryptoSignatureService("test-secret");
        
        userService = new UserService(userRepo, favRepo, histRepo, searchHistRepo, sigService, mockLogger);
    });

    it("should integrate Service and Repositories to manage user favourites", async () => {
        // Use camelCase to match SQL aliases
        const mockFav = { id: "1", userId: "u1", songId: "s1" };
        mockDb.mockResolvedValue([mockFav]);

        const result = await userService.addFavourite("u1", "s1");

        expect(result.userId).toBe("u1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should integrate Service and Repositories to fetch user history", async () => {
        // Use camelCase to match SQL aliases
        const mockRows = [{ id: "h1", userId: "u1", songId: "s1", part: 100, listenedAt: new Date().toISOString() }];
        mockDb.mockResolvedValue(mockRows);

        const result = await userService.getHistory("u1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.userId).toBe("u1");
    });
});
