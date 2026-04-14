import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "../../src/services/song.service";
import { SongRepository } from "../../src/repository/song.repository";
import { PlaylistService } from "../../src/services/playlist.service";
import { PlaylistRepository } from "../../src/repository/playlist.repository";
import { SongProcessingJobRepository } from "../../src/repository/song-processing-job.repository";

describe("Entity Discovery Integration", () => {
    let songRepo: SongRepository;
    let songService: SongService;
    let playlistRepo: PlaylistRepository;
    let playlistService: PlaylistService;
    let jobRepo: SongProcessingJobRepository;
    let mockDb: any;
    let mockLogger: any;
    let mockInngest: any;
    let mockSearch: any;
    let mockRec: any;
    let mockSig: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { 
            info: vi.fn(), 
            error: vi.fn(), 
            debug: vi.fn(), 
            warn: vi.fn(), 
            child: vi.fn().mockReturnThis() 
        };
        mockInngest = { send: vi.fn() };
        mockSearch = { save: vi.fn(), delete: vi.fn() };
        mockRec = { delete: vi.fn() };
        mockSig = { 
            generateSignedId: vi.fn().mockReturnValue("signed-id"), 
            verifyId: vi.fn() 
        };

        songRepo = new SongRepository(mockDb, mockLogger);
        jobRepo = new SongProcessingJobRepository(mockDb, mockLogger);
        
        songService = new SongService(
            songRepo, 
            jobRepo, 
            mockSig, 
            mockSearch, 
            mockRec, 
            mockLogger, 
            mockInngest
        );
        
        playlistRepo = new PlaylistRepository(mockDb, mockLogger);
        playlistService = new PlaylistService(
            playlistRepo, 
            mockSig, 
            mockSearch, 
            mockLogger
        );
    });

    describe("Song Discovery", () => {
        it("should integrate Service and Repository to fetch paginated songs", async () => {
            const mockRows = [{ 
                id: "1", title: "S1", artistName: "A1", duration: 180, 
                songKey: "k1", imageKey: "i1", language: "en", jobId: "j1",
                createdAt: new Date().toISOString() 
            }];
            
            mockDb.mockImplementation((arg: any) => {
                const sqlStr = Array.isArray(arg) ? arg.join("") : (typeof arg === 'string' ? arg : "");
                if (sqlStr.includes("count(*)")) return Promise.resolve([{ count: 1 }]);
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
            const mockPlaylists = [{ 
                id: "p1", name: "Top Charts", 
                coverImageKey: "k1", bannerImageKey: "b1", 
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() 
            }];
            mockDb.mockResolvedValue(mockPlaylists);

            const result = await playlistService.getPlaylists({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.name).toBe("Top Charts");
        });
    });
});
