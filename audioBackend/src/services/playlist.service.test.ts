import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistService } from "./playlist.service";

describe("PlaylistService", () => {
    let service: PlaylistService;
    let mockRepo: any;
    let mockLogger: any;

    beforeEach(() => {
        mockRepo = {
            getById: vi.fn(),
            getAll: vi.fn(),
            count: vi.fn(),
            getSongs: vi.fn(),
            countSongs: vi.fn(),
        };
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        service = new PlaylistService(mockRepo, mockLogger);
    });

    it("should get playlist by id", async () => {
        mockRepo.getById.mockResolvedValue({ id: "1", name: "P1" });
        const result = await service.getPlaylistById("1");
        expect(result.id).toBe("1");
    });

    it("should get paginated playlists", async () => {
        mockRepo.getAll.mockResolvedValue([{ id: "1" }]);
        mockRepo.count.mockResolvedValue(1);

        const result = await service.getPlaylists({ page: 1, limit: 10 });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
    });

    it("should get songs for a playlist", async () => {
        mockRepo.getSongs.mockResolvedValue([{ id: "s1" }]);
        mockRepo.countSongs.mockResolvedValue(1);

        const result = await service.getPlaylistSongs("p1", { page: 1, limit: 10 });

        expect(result.data).toHaveLength(1);
    });
});
