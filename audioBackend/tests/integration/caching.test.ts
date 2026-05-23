import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService, PlaylistService, ArtistService } from "@onemelody/core";

describe("Caching Integration Tests in Services", () => {
    let mockSongRepo: any;
    let mockPlaylistRepo: any;
    let mockArtistRepo: any;
    let mockSignatureService: any;
    let mockLogger: any;
    let mockCacheService: any;

    let songService: SongService;
    let playlistService: PlaylistService;
    let artistService: ArtistService;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSongRepo = {
            getAll: vi.fn(),
            count: vi.fn(),
            getById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            getArtistSongs: vi.fn(),
            countByArtistName: vi.fn(),
        };

        mockPlaylistRepo = {
            getAll: vi.fn(),
            count: vi.fn(),
            getById: vi.fn(),
            getSongs: vi.fn(),
            countSongs: vi.fn(),
            addSong: vi.fn(),
            removeSong: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        };

        mockArtistRepo = {
            getAll: vi.fn(),
            count: vi.fn(),
            getById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        mockSignatureService = {
            verifyId: vi.fn(),
            generateSignedId: vi.fn().mockReturnValue("signed-id"),
        };

        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        mockCacheService = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            delByPattern: vi.fn(),
        };

        songService = new SongService(
            mockSongRepo,
            mockSignatureService,
            mockLogger,
            undefined, undefined, undefined, undefined, undefined, undefined,
            mockCacheService
        );

        playlistService = new PlaylistService(
            mockPlaylistRepo,
            mockSignatureService,
            mockLogger,
            undefined, undefined,
            mockCacheService
        );

        artistService = new ArtistService(
            mockArtistRepo,
            mockSongRepo,
            mockSignatureService,
            mockLogger,
            undefined, undefined,
            mockCacheService
        );
    });

    describe("SongService Cache Integration", () => {
        it("should cache getSongs lists (5 min TTL) and reuse cache", async () => {
            const mockSongsResult = {
                data: [{ id: "s1", title: "Song 1" }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
            };

            mockCacheService.get.mockResolvedValueOnce(null); // Miss first time
            mockSongRepo.getAll.mockResolvedValueOnce([{ id: "s1", title: "Song 1" }]);
            mockSongRepo.count.mockResolvedValueOnce(1);

            const res1 = await songService.getSongs({ page: 1, limit: 10 });
            expect(res1).toEqual(mockSongsResult);
            expect(mockCacheService.set).toHaveBeenCalledWith("songs:list:page:1:limit:10", mockSongsResult, 300);

            // Mock Hit next time
            mockCacheService.get.mockResolvedValueOnce(mockSongsResult);
            const res2 = await songService.getSongs({ page: 1, limit: 10 });
            expect(res2).toEqual(mockSongsResult);
            expect(mockSongRepo.getAll).toHaveBeenCalledTimes(1); // Still only 1 call total
        });

        it("should invalidate cache on updateSong and deleteSong", async () => {
            const mockSong = { id: "s1", title: "Song 1" };
            mockSongRepo.update.mockResolvedValueOnce(mockSong);
            mockSongRepo.delete.mockResolvedValueOnce(mockSong);

            await songService.updateSong("s1", { title: "Updated" });
            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:s1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");

            await songService.deleteSong("s1");
            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:s1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
        });
    });

    describe("PlaylistService Cache Integration", () => {
        it("should cache getPlaylistSongs tracklist (10 min TTL) and reuse cache", async () => {
            const mockTracksResult = {
                data: [{ id: "s1", title: "Song 1" }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
            };

            mockCacheService.get.mockResolvedValueOnce(null);
            mockPlaylistRepo.getSongs.mockResolvedValueOnce([{ id: "s1", title: "Song 1" }]);
            mockPlaylistRepo.countSongs.mockResolvedValueOnce(1);

            const res = await playlistService.getPlaylistSongs("p1", { page: 1, limit: 10 });
            expect(res).toEqual(mockTracksResult);
            expect(mockCacheService.set).toHaveBeenCalledWith("playlists:songs:id:p1:page:1:limit:10", mockTracksResult, 600);
        });

        it("should invalidate playlist cache and tracklists on add/remove song", async () => {
            const relationship = { playlistId: "p1", songId: "s1" };
            mockPlaylistRepo.addSong.mockResolvedValueOnce(relationship);
            mockPlaylistRepo.removeSong.mockResolvedValueOnce(relationship);

            await playlistService.addSongToPlaylist(relationship);
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");

            await playlistService.removeSongFromPlaylist(relationship);
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
        });

        it("should invalidate detail, tracklists, and catalogues on playlist deletion", async () => {
            mockPlaylistRepo.delete.mockResolvedValueOnce({ id: "p1", name: "Playlist 1" });

            await playlistService.deletePlaylist("p1");
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
        });
    });

    describe("ArtistService Cache Integration", () => {
        it("should cache getArtistSongs tracklist (10 min TTL)", async () => {
            const mockSongsResult = {
                data: [{ id: "s1", title: "Song 1" }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
            };

            mockCacheService.get.mockResolvedValueOnce(null);
            mockArtistRepo.getById.mockResolvedValueOnce({ id: "a1", name: "Artist One" });
            mockSongRepo.getArtistSongs.mockResolvedValueOnce([{ id: "s1", title: "Song 1" }]);
            mockSongRepo.countByArtistName.mockResolvedValueOnce(1);

            const res = await artistService.getArtistSongs("a1", { page: 1, limit: 10 });
            expect(res).toEqual(mockSongsResult);
            expect(mockCacheService.set).toHaveBeenCalledWith("artists:songs:id:a1:page:1:limit:10", mockSongsResult, 600);
        });

        it("should invalidate artist detail, songs, and catalog on artist update/deletion", async () => {
            mockArtistRepo.update.mockResolvedValueOnce({ id: "a1", name: "Artist One" });
            mockArtistRepo.delete.mockResolvedValueOnce({ id: "a1", name: "Artist One" });

            await artistService.updateArtist("a1", { name: "New Name" });
            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");

            await artistService.deleteArtist("a1");
            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
        });
    });
});
