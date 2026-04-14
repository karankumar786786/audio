import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserSearchHistoryRepository } from "./user-search-history.repository";

describe("UserSearchHistoryRepository", () => {
    let repo: UserSearchHistoryRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        repo = new UserSearchHistoryRepository(mockDb, mockLogger);
    });

    const createMockSearchHistory = (overrides = {}) => ({
        id: "s1",
        userId: "u1",
        searchedText: "rock",
        ...overrides
    });

    it("should record search history correctly", async () => {
        const mockSearch = createMockSearchHistory();
        mockDb.mockResolvedValue([mockSearch]);

        const result = await repo.create({ userId: "u1", searchedText: "rock" });

        expect(result.userId).toBe("u1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch search history by user id", async () => {
        const mockSearch = createMockSearchHistory();
        mockDb.mockResolvedValue([mockSearch]);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.userId).toBe("u1");
    });
});
