import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractionRepository } from "./interaction.repository";

describe("InteractionRepository", () => {
    let repo: InteractionRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        repo = new InteractionRepository(mockDb, mockLogger);
    });

    const createMockSong = (overrides = {}) => ({
        id: "s1",
        title: "Song 1",
        artistName: "Artist 1",
        duration: 200,
        songKey: "k1",
        imageKey: "i1",
        language: "en",
        jobId: "j1",
        createdAt: new Date().toISOString(),
        ...overrides
    });

    it("should fetch trending songs correctly", async () => {
        const mockSongs = [createMockSong()];
        mockDb.mockResolvedValue(mockSongs);

        const result = await repo.getTrendingSongs(10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.title).toBe("Song 1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should count trending songs", async () => {
        mockDb.mockResolvedValue([{ count: 5 }]);
        const result = await repo.countTrendingSongs();
        expect(result).toBe(5);
    });
});
