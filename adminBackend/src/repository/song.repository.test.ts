import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongRepository } from "./song.repository";
import { NotFoundError } from "../errors";

describe("SongRepository", () => {
    let repository: SongRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };
        repository = new SongRepository(mockDb, mockLogger);
    });

    describe("mapRow", () => {
        it("should map database rows to SongSchema correctly", () => {
            const date = new Date();
            const mockRow = {
                id: "1",
                title: "Test Song",
                artist_name: "Artist",
                duration: 180,
                song_key: "key",
                image_key: "img",
                language: "en",
                job_id: "job",
                created_at: date,
            };

            const result = (repository as any).mapRow(mockRow);

            expect(result).toEqual({
                id: "1",
                title: "Test Song",
                artistName: "Artist",
                duration: 180,
                songKey: "key",
                imageKey: "img",
                language: "en",
                jobId: "job",
                createdAt: date.toISOString(),
            });
        });
    });

    describe("getById", () => {
        it("should return a song if found", async () => {
            const mockRow = { id: "1", title: "Song" };
            mockDb.mockResolvedValue([mockRow]);

            const result = await repository.getById("1");

            expect(result.id).toBe("1");
            expect(mockDb).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining("SELECT * FROM songs WHERE id = ")]), "1");
        });

        it("should throw NotFoundError if not found", async () => {
            mockDb.mockResolvedValue([]);

            await expect(repository.getById("999")).rejects.toThrow(NotFoundError);
        });
    });

    describe("create", () => {
        it("should insert a new song and return it", async () => {
            const songData = {
                id: "1",
                title: "New",
                artistName: "A",
                duration: 100,
                songKey: "k",
                imageKey: "i",
                language: "hi",
                jobId: "j"
            };
            mockDb.mockResolvedValue([ { ...songData, artist_name: "A", song_key: "k", image_key: "i", job_id: "j" } ]);

            const result = await repository.create(songData);

            expect(result.id).toBe("1");
            expect(mockDb).toHaveBeenCalled();
        });
    });
});
