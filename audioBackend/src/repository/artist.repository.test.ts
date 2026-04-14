import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistRepository } from "./artist.repository";

describe("ArtistRepository", () => {
    let repo: ArtistRepository;
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

        repo = new ArtistRepository(mockDb, mockLogger);
    });

    it("should map rows correctly and fetch artist by id", async () => {
        const mockRow = {
            id: "1",
            name: "Artist One",
            about: "About One",
            dob: new Date("1990-01-01"),
            cover_image_key: "cover.jpg",
            banner_image_key: "banner.jpg",
            created_at: new Date()
        };
        mockDb.mockResolvedValue([mockRow]);

        const result = await repo.getById("1");

        expect(result.id).toBe("1");
        expect(result.name).toBe("Artist One");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should return empty list if no artists found in getAll", async () => {
        mockDb.mockResolvedValue([]);
        const result = await repo.getAll();
        expect(result).toHaveLength(0);
    });
});
