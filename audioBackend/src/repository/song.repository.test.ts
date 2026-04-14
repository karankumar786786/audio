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
        expect(result!.title).toBe("Test Song");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch song by id", async () => {
        const mockSong = createMockSong({ id: "1", title: "Song One" });
        mockDb.mockResolvedValue([mockSong]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.title).toBe("Song One");
    });

    it("should fetch songs by artist name", async () => {
        const mockSongs = [
            createMockSong({ id: "1", title: "S1", artistName: "A1" }),
            createMockSong({ id: "2", title: "S2", artistName: "A1" })
        ];
        mockDb.mockResolvedValue(mockSongs);

        const result = await repo.getByArtistName("A1", 10, 0);

        expect(result).toHaveLength(2);
        expect(result[0]!.artistName).toBe("A1");
    });

    it("should count songs by artist name", async () => {
        mockDb.mockResolvedValue([{ count: 5 }]);
        const result = await repo.countByArtistName("A1");
        expect(result).toBe(5);
    });
});
