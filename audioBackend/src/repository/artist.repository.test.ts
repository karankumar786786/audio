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

    const createMockArtist = (overrides = {}) => ({
        id: "artist-1",
        name: "Test Artist",
        about: "Bio",
        dob: "1990-01-01",
        coverImageKey: "c1",
        bannerImageKey: "b1",
        createdAt: new Date().toISOString(),
        ...overrides
    });

    it("should create an artist correctly", async () => {
        const mockArtist = createMockArtist();
        mockDb.mockResolvedValue([mockArtist]);

        const result = await repo.create({
            id: "artist-1",
            name: "Test Artist",
            about: "Bio",
            dob: "1990-01-01",
            coverImageKey: "c1",
            bannerImageKey: "b1"
        });

        expect(result!.id).toBe("artist-1");
        expect(result!.name).toBe("Test Artist");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch artist by id", async () => {
        const mockArtist = createMockArtist({ id: "1", name: "Artist One" });
        mockDb.mockResolvedValue([mockArtist]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.name).toBe("Artist One");
    });
});
