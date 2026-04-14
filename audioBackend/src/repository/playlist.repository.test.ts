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

    const createMockPlaylist = (overrides = {}) => ({
        id: "playlist-1",
        name: "Test Playlist",
        coverImageKey: "c1",
        bannerImageKey: "b1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides
    });

    it("should create a playlist correctly", async () => {
        const mockPlaylist = createMockPlaylist();
        mockDb.mockResolvedValue([mockPlaylist]);

        const result = await repo.create({
            id: "playlist-1",
            name: "Test Playlist",
            coverImageKey: "c1",
            bannerImageKey: "b1"
        });

        expect(result!.id).toBe("playlist-1");
        expect(result!.name).toBe("Test Playlist");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch playlist by id", async () => {
        const mockPlaylist = createMockPlaylist({ id: "1", name: "Playlist One" });
        mockDb.mockResolvedValue([mockPlaylist]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.name).toBe("Playlist One");
    });
});
