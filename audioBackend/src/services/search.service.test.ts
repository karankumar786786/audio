import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "./search.service";

describe("SearchService", () => {
    let service: SearchService;
    let mockAlgolia: any;
    let mockLogger: any;

    beforeEach(() => {
        mockAlgolia = { search: vi.fn() };
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };

        service = new SearchService(mockAlgolia, mockLogger);
    });

    it("should perform unified search across multiple indexes", async () => {
        const mockHits = [
            { objectID: "s1", title: "S1", artistName: "A1" },
            { objectID: "a1", name: "A1", about: "About A1" },
            { objectID: "p1", name: "P1", coverImageKey: "img.jpg" }
        ];
        mockAlgolia.search.mockResolvedValue(mockHits);

        const result = await service.unifiedSearch("query");

        expect(result.songs).toHaveLength(1);
        expect(result.artists).toHaveLength(1);
        expect(result.playlists).toHaveLength(1);
        expect(mockAlgolia.search).toHaveBeenCalled();
    });

    it("should return empty results if search fails or is empty", async () => {
        mockAlgolia.search.mockResolvedValue([]);
        const result = await service.unifiedSearch("query");
        expect(result.songs).toHaveLength(0);
    });
});
