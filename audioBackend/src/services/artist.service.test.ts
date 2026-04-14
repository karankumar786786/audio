import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "./artist.service";

describe("ArtistService", () => {
    let service: ArtistService;
    let mockRepo: any;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockRepo = {
            getAll: vi.fn(),
            count: vi.fn(),
            getById: vi.fn(),
        };
        mockDb = vi.fn() as any;
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        service = new ArtistService(mockRepo, mockDb, mockLogger);
    });

    describe("getArtists", () => {
        it("should return paginated result", async () => {
            const params = { page: 1, limit: 10 };
            mockRepo.getAll.mockResolvedValue([]);
            mockRepo.count.mockResolvedValue(0);

            const result = await service.getArtists(params);

            expect(result.pagination.total).toBe(0);
            expect(mockRepo.getAll).toHaveBeenCalledWith(10, 0);
        });
    });

    describe("getArtistById", () => {
        it("should call repo getById", async () => {
            const mockArtist = { id: "1", name: "A" };
            mockRepo.getById.mockResolvedValue(mockArtist);

            const result = await service.getArtistById("1");

            expect(result.id).toBe("1");
            expect(mockRepo.getById).toHaveBeenCalledWith("1");
        });
    });
});
