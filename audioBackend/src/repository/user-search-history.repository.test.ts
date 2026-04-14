import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserSearchHistoryRepository } from "./user-search-history.repository";

describe("UserSearchHistoryRepository", () => {
    let repo: UserSearchHistoryRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        repo = new UserSearchHistoryRepository(mockDb, mockLogger);
    });

    it("should create a search entry correctly", async () => {
        const mockEntry = { id: "1", user_id: "u1", searched_text: "queen", searched_at: new Date() };
        mockDb.mockResolvedValue([mockEntry]);

        const result = await repo.create({ id: "1", userId: "u1", searchedText: "queen" });

        expect(result!.searchedText).toBe("queen");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch search history by user id", async () => {
        const mockRows = [{ id: "1", searched_text: "queen" }];
        mockDb.mockResolvedValue(mockRows);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.searchedText).toBe("queen");
    });

    it("should clear user history correctly", async () => {
        mockDb.mockResolvedValue([]);
        await repo.clearUserHistory("u1");
        expect(mockDb).toHaveBeenCalled();
    });
});
