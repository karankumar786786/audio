import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractionService } from "./interaction.service";

describe("InteractionService", () => {
    let service: InteractionService;
    let mockHistRepo: any;
    let mockInterRepo: any;
    let mockRecService: any;
    let mockSigService: any;
    let mockLogger: any;

    beforeEach(() => {
        mockHistRepo = { create: vi.fn() };
        mockInterRepo = { 
            getTrendingSongs: vi.fn(), 
            getTrendingSongsCount: vi.fn(),
            getSongsByIds: vi.fn(), 
            recordListen: vi.fn() 
        };
        mockRecService = { recommendUser: vi.fn(), addListen: vi.fn() };
        mockSigService = { generateSignedId: vi.fn().mockReturnValue("signed-id") };
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };

        service = new InteractionService(
            mockHistRepo,
            mockInterRepo,
            mockRecService,
            mockSigService,
            mockLogger
        );
    });

    it("should record listen with both history and analytics", async () => {
        mockHistRepo.create.mockResolvedValue({ id: "1" });
        mockRecService.addListen.mockResolvedValue({ id: "1" });

        await service.recordListen("u1", "s1", 100);

        expect(mockHistRepo.create).toHaveBeenCalled();
        expect(mockRecService.addListen).toHaveBeenCalled();
    });

    it("should fetch trending results paginated", async () => {
        mockInterRepo.getTrendingSongs.mockResolvedValue([{ id: "s1" }]);
        mockInterRepo.getTrendingSongsCount.mockResolvedValue(1);
        const result = await service.getTrendingSongs({ page: 1, limit: 10 });
        expect(result.data).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
    });

    it("should fetch recommendations and map to full song objects", async () => {
        mockRecService.recommendUser.mockResolvedValue([{ id: "s1" }]);
        mockInterRepo.getSongsByIds.mockResolvedValue([{ id: "s1", title: "T1" }]);

        const result = await service.getRecommendations("u1", 10);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("T1");
    });
});
