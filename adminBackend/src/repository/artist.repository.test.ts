import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistRepository } from "./artist.repository";

describe("ArtistRepository", () => {
    let repo: ArtistRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        // mockDb is the neon function
        mockDb = vi.fn();
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        repo = new ArtistRepository(mockDb, mockLogger);
    });

    it("should map rows correctly from the database", async () => {
        const mockRows = [{
            id: "1",
            name: "Artist One",
            about: "About One",
            dob: new Date("1990-01-01"),
            cover_image_key: "cover.jpg",
            banner_image_key: "banner.jpg",
            created_at: new Date()
        }];
        mockDb.mockResolvedValue(mockRows);

        const result = await repo.getById("1");

        expect(result.name).toBe("Artist One");
        expect(result.id).toBe("1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should throw NotFoundError if artist doesn't exist", async () => {
        mockDb.mockResolvedValue([]);

        await expect(repo.getById("999")).rejects.toThrow();
    });
});
