import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserPlaylistRepository } from "./user-playlist.repository";

describe("UserPlaylistRepository", () => {
    let repo: UserPlaylistRepository;
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

        repo = new UserPlaylistRepository(mockDb, mockLogger);
    });

    it("should create a user playlist correctly", async () => {
        const mockPlaylist = {
            id: "up1",
            user_id: "u1",
            name: "My Favs",
            image_key: "img.jpg",
            created_at: new Date()
        };
        mockDb.mockResolvedValue([mockPlaylist]);

        const result = await repo.create({
            id: "up1",
            userId: "u1",
            name: "My Favs"
        });

        expect(result!.id).toBe("up1");
        expect(result!.name).toBe("My Favs");
    });

    it("should fetch playlist by id", async () => {
        const mockRow = { id: "1", name: "P1" };
        mockDb.mockResolvedValue([mockRow]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
    });

    it("should fetch playlists by user id", async () => {
        const mockPlaylists = [{ id: "1" }, { id: "2" }];
        mockDb.mockResolvedValue(mockPlaylists);

        const result = await repo.getByUserId("u1", 10, 0);

        expect(result).toHaveLength(2);
    });

    it("should add/remove songs correctly", async () => {
        mockDb.mockResolvedValue([{ id: "entry-1" }]);
        const result = await repo.addSong("up1", "s1");
        expect(result).toBeDefined();

        mockDb.mockResolvedValue([{ id: "entry-1" }]);
        const removed = await repo.removeSong("up1", "s1");
        expect(removed).toBeDefined();
    });
});
