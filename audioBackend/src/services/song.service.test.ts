import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "./song.service";

describe("SongService", () => {
    let service: SongService;
    let mockRepo: any;
    let mockLogger: any;

    beforeEach(() => {
        mockRepo = {
            create: vi.fn(),
            getById: vi.fn(),
            getAll: vi.fn(),
            count: vi.fn(),
        };
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        service = new SongService(mockRepo, mockLogger);
    });

    it("should get specific song by id", async () => {
        const mockSong = { id: "1", title: "S1" };
        mockRepo.getById.mockResolvedValue(mockSong);

        const result = await service.getSongById("1");

        expect(result.id).toBe("1");
        expect(mockRepo.getById).toHaveBeenCalledWith("1");
    });

    it("should fetch paginated songs", async () => {
        mockRepo.getAll.mockResolvedValue([{ id: "1" }]);
        mockRepo.count.mockResolvedValue(1);

        const result = await service.getSongs({ page: 1, limit: 10 });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
    });
});
