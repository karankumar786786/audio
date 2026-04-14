import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistRepository } from "./playlist.repository";
import { NotFoundError, ConflictError } from "../errors";

describe("PlaylistRepository", () => {
    let repository: PlaylistRepository;
    let mockDb: any;
    let mockLogger: any;
    let mockSignature: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };
        mockSignature = {
            generateSignedId: vi.fn().mockReturnValue("signed-id"),
        };
        repository = new PlaylistRepository(mockDb, mockLogger, mockSignature);
    });

    describe("mapRow", () => {
        it("should map database rows to PlaylistSchema correctly", () => {
            const date = new Date();
            const mockRow = {
                id: "1",
                name: "Test Playlist",
                cover_image_key: "cover",
                banner_image_key: "banner",
                created_at: date,
                updated_at: date,
            };

            const result = (repository as any).mapRow(mockRow);

            expect(result).toEqual({
                id: "1",
                name: "Test Playlist",
                coverImageKey: "cover",
                bannerImageKey: "banner",
                createdAt: date.toISOString(),
                updatedAt: date.toISOString(),
            });
        });
    });

    describe("addSong", () => {
        it("should add a song to a playlist", async () => {
            const data = { playlistId: "p1", songId: "s1" };
            mockDb.mockResolvedValue([{ id: "signed-id", playlist_id: "p1", song_id: "s1" }]);

            const result = await repository.addSong(data);

            expect(result.id).toBe("signed-id");
            expect(mockDb).toHaveBeenCalled();
        });

        it("should throw ConflictError if song already exists", async () => {
            mockDb.mockResolvedValue([]); // ON CONFLICT DO NOTHING returns empty array

            await expect(repository.addSong({ playlistId: "p1", songId: "s1" }))
                .rejects.toThrow(ConflictError);
        });
    });

    describe("getSongs", () => {
        it("should return songs in a playlist with correct joining", async () => {
            const mockSongs = [{ id: "s1", title: "Song 1", artistName: "Artist" }];
            mockDb.mockResolvedValue(mockSongs);

            const result = await repository.getSongs("p1");

            expect(result).toEqual(mockSongs);
            expect(mockDb).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining("JOIN songs s")]), "p1", null, null);
        });
    });
});
