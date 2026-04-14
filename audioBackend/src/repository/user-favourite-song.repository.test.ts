import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserFavouriteSongRepository } from "./user-favourite-song.repository";

describe("UserFavouriteSongRepository", () => {
    let repo: UserFavouriteSongRepository;
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

        repo = new UserFavouriteSongRepository(mockDb, mockLogger);
    });

    it("should create a favourite correctly", async () => {
        const mockFav = { id: "1", user_id: "u1", song_id: "s1", created_at: new Date() };
        mockDb.mockResolvedValue([mockFav]);

        const result = await repo.create({ id: "1", userId: "u1", songId: "s1" });

        expect(result!.userId).toBe("u1");
        expect(result!.songId).toBe("s1");
    });

    it("should remove favourite correctly", async () => {
        const mockFav = { id: "1" };
        mockDb.mockResolvedValue([mockFav]);

        const result = await repo.remove("u1", "s1");

        expect(result!.id).toBe("1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch favourites by user id", async () => {
        const mockRows = [{ id: "s1", title: "T1" }];
        mockDb.mockResolvedValue(mockRows);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.title).toBe("T1");
    });
});
