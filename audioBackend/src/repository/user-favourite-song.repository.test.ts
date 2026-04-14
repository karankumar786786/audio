import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserFavouriteSongRepository } from "./user-favourite-song.repository";

describe("UserFavouriteSongRepository", () => {
    let repo: UserFavouriteSongRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        repo = new UserFavouriteSongRepository(mockDb, mockLogger);
    });

    const createMockFav = (overrides = {}) => ({
        id: "1",
        userId: "u1",
        songId: "s1",
        ...overrides
    });

    it("should favourite a song correctly", async () => {
        const mockFav = createMockFav();
        mockDb.mockResolvedValue([mockFav]);

        const result = await repo.create({ userId: "u1", songId: "s1" });

        expect(result.userId).toBe("u1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should find by user and song", async () => {
        const mockFav = createMockFav();
        mockDb.mockResolvedValue([mockFav]);

        const result = await repo.getByUserAndSong("u1", "s1");

        expect(result!.userId).toBe("u1");
    });
});
