import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongRepository } from "./song.repository";

describe("SongRepository", () => {
    let repo: SongRepository;
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

        repo = new SongRepository(mockDb, mockLogger);
    });

    const createMockSong = (overrides = {}) => ({
        id: "song-1",
        title: "Test Song",
        artistName: "Test Artist",
        duration: 180,
        songKey: "songs/1.mp3",
        imageKey: "images/1.jpg",
        language: "en",
        jobId: "job-1",
        createdAt: new Date().toISOString(),
        ...overrides
    });

    it("should create a song correctly", async () => {
        const mockSong = createMockSong();
        mockDb.mockResolvedValue([mockSong]);

        const result = await repo.create({
            id: "song-1",
            title: "Test Song",
            artistName: "Test Artist",
            duration: 180,
            songKey: "songs/1.mp3",
            imageKey: "images/1.jpg",
            language: "en",
            jobId: "job-1"
        });

        expect(result!.id).toBe("song-1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch song by id", async () => {
        const mockSong = createMockSong({ id: "1" });
        mockDb.mockImplementation((arg: any) => {
             return Promise.resolve([mockSong]);
        });

        const result = await repo.getById("1");
        expect(result!.id).toBe("1");
    });
});
