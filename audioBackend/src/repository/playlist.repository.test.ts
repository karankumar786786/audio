import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistRepository } from "./playlist.repository";

describe("PlaylistRepository", () => {
    let repo: PlaylistRepository;
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

        repo = new PlaylistRepository(mockDb, mockLogger);
    });

    it("should create a playlist correctly", async () => {
        const mockPlaylist = {
            id: "p1",
            name: "N1",
            description: "D1",
            image_key: "k1",
            created_at: new Date()
        };
        mockDb.mockResolvedValue([mockPlaylist]);

        const result = await repo.create({
            id: "p1",
            name: "N1",
            coverImageKey: "k1",
            bannerImageKey: "b1"
        });

        expect(result!.id).toBe("p1");
        expect(result!.name).toBe("N1");
    });

    it("should fetch playlist by id", async () => {
        const mockRow = { id: "1", name: "P1" };
        mockDb.mockResolvedValue([mockRow]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.name).toBe("P1");
    });

    it("should add song to playlist", async () => {
        mockDb.mockResolvedValue([{ id: "entry-1" }]);
        const result = await repo.addSong("p1", "s1");
        expect(result).toBeDefined();
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch playlist songs", async () => {
        const mockSongs = [{ id: "s1", title: "Song 1", artist_name: "A1" }];
        mockDb.mockResolvedValue(mockSongs);

        const result = await repo.getSongs("p1", 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.title).toBe("Song 1");
    });
});
