import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserHistoryRepository } from "./user-history.repository";

describe("UserHistoryRepository", () => {
    let repo: UserHistoryRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        repo = new UserHistoryRepository(mockDb, mockLogger);
    });

    const createMockHistory = (overrides = {}) => ({
        id: "h1",
        userId: "u1",
        songId: "s1",
        part: 100,
        listenedAt: new Date().toISOString(),
        ...overrides
    });

    it("should record history correctly", async () => {
        const mockHistory = createMockHistory();
        mockDb.mockResolvedValue([mockHistory]);

        const result = await repo.create({ userId: "u1", songId: "s1", part: 100 });

        expect(result.userId).toBe("u1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch history by user id", async () => {
        const mockHistory = createMockHistory();
        mockDb.mockResolvedValue([mockHistory]);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.userId).toBe("u1");
    });
});
