import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserHistoryRepository } from "./user-history.repository";

describe("UserHistoryRepository", () => {
    let repo: UserHistoryRepository;
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

        repo = new UserHistoryRepository(mockDb, mockLogger);
    });

    it("should create a history entry correctly", async () => {
        const mockEntry = { id: "1", user_id: "u1", song_id: "s1", played_at: new Date() };
        mockDb.mockResolvedValue([mockEntry]);

        const result = await repo.create({ id: "1", userId: "u1", songId: "s1", part: 100 });

        expect(result!.userId).toBe("u1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch history by user id", async () => {
        const mockRows = [{ id: "s1", title: "T1" }];
        mockDb.mockResolvedValue(mockRows);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(1);
    });
});
