import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "../../src/services/song.service";
import { SongRepository } from "../../src/repository/song.repository";
import { PlaylistService } from "../../src/services/playlist.service";
import { PlaylistRepository } from "../../src/repository/playlist.repository";

describe("Entity Discovery Integration", () => {
    let songRepo: SongRepository;
    let songService: SongService;
    let playlistRepo: PlaylistRepository;
    let playlistService: PlaylistService;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        
        songRepo = new SongRepository(mockDb, mockLogger);
        songService = new SongService(songRepo, mockLogger);
        
        playlistRepo = new PlaylistRepository(mockDb, mockLogger);
        playlistService = new PlaylistService(playlistRepo, mockLogger);
    });

    describe("Song Discovery", () => {
        it("should integrate Service and Repository to fetch paginated songs", async () => {
            // Use mockResolvedValueOnce to match the execution order in service.getSongs: getAll then count
            const mockRows = [{ id: "1", title: "S1", artist_name: "A1" }];
            mockDb.mockImplementation((sql: any) => {
                if (sql.join("").includes("count(*)")) return Promise.resolve([{ count: 1 }]);
                return Promise.resolve(mockRows);
            });

            const result = await songService.getSongs({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.title).toBe("S1");
            expect(result.pagination.total).toBe(1);
        });
    });

    describe("Playlist Discovery", () => {
        it("should integrate Service and Repository to fetch playlists", async () => {
            const mockPlaylists = [{ id: "p1", name: "Top Charts", cover_image_key: "k1", banner_image_key: "b1" }];
            mockDb.mockResolvedValue(mockPlaylists);

            const result = await playlistService.getPlaylists({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.name).toBe("Top Charts");
            expect(mockDb).toHaveBeenCalled();
        });
    });
});
