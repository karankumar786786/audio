import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistService } from "../../src/services/playlist.service.ts";

// ── Shared mocks ─────────────────────────────────────────────────────────────

const mockPlaylistRepo = {
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

const mockSignatureService = {
    verifyId: vi.fn(),
    generateSignedId: vi.fn().mockReturnValue("new-playlist-id"),
};

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    child: vi.fn().mockReturnThis(),
};

const mockCacheService = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delByPattern: vi.fn(),
};

// ── Test data ────────────────────────────────────────────────────────────────

const fakePlaylist = {
    id: "playlist-1",
    name: "Test Playlist",
    description: "A test playlist",
    coverImageKey: null,
    bannerImageKey: null,
};

const fakeSong = {
    id: "song-1",
    title: "Test Song",
    artistName: "Test Artist",
};

const fakePaginatedResult = {
    data: [fakePlaylist],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
};

const fakeSongsPaginatedResult = {
    data: [fakeSong],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
};

// ── Helper ───────────────────────────────────────────────────────────────────

function createService(withCache = true) {
    return new PlaylistService(
        mockPlaylistRepo as any,
        mockSignatureService as any,
        mockLogger as any,
        undefined,  // searchService
        undefined,  // imageKitClient
        withCache ? (mockCacheService as any) : undefined,
    );
}

describe("PlaylistService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── getPlaylists() ───────────────────────────────────────────────────────

    describe("getPlaylists()", () => {
        const params = { page: 1, limit: 10 };

        it("should return cached data on cache hit without calling repository", async () => {
            mockCacheService.get.mockResolvedValue(fakePaginatedResult);
            const service = createService();

            const result = await service.getPlaylists(params);

            expect(mockCacheService.get).toHaveBeenCalledWith("playlists:list:page:1:limit:10");
            expect(mockPlaylistRepo.getAll).not.toHaveBeenCalled();
            expect(mockPlaylistRepo.count).not.toHaveBeenCalled();
            expect(result).toEqual(fakePaginatedResult);
        });

        it("should call repository and cache result with 300s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPlaylistRepo.getAll.mockResolvedValue([fakePlaylist]);
            mockPlaylistRepo.count.mockResolvedValue(1);
            const service = createService();

            const result = await service.getPlaylists(params);

            expect(mockPlaylistRepo.getAll).toHaveBeenCalledWith(10, 0);
            expect(mockPlaylistRepo.count).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "playlists:list:page:1:limit:10",
                expect.objectContaining({ data: [fakePlaylist], total: 1 }),
                300,
            );
            expect(result.data).toEqual([fakePlaylist]);
        });

        it("should work without cache service", async () => {
            mockPlaylistRepo.getAll.mockResolvedValue([fakePlaylist]);
            mockPlaylistRepo.count.mockResolvedValue(1);
            const service = createService(false);

            const result = await service.getPlaylists(params);

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([fakePlaylist]);
        });
    });

    // ── getPlaylistById() ────────────────────────────────────────────────────

    describe("getPlaylistById()", () => {
        it("should return cached playlist on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(fakePlaylist);
            const service = createService();

            const result = await service.getPlaylistById("playlist-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("playlist-1", "playlistId");
            expect(mockCacheService.get).toHaveBeenCalledWith("playlists:id:playlist-1");
            expect(mockPlaylistRepo.getById).not.toHaveBeenCalled();
            expect(result).toEqual(fakePlaylist);
        });

        it("should call repository and cache with 3600s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPlaylistRepo.getById.mockResolvedValue(fakePlaylist);
            const service = createService();

            const result = await service.getPlaylistById("playlist-1");

            expect(mockPlaylistRepo.getById).toHaveBeenCalledWith("playlist-1");
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "playlists:id:playlist-1",
                fakePlaylist,
                3600,
            );
            expect(result).toEqual(fakePlaylist);
        });

        it("should not cache when repository returns null", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPlaylistRepo.getById.mockResolvedValue(null);
            const service = createService();

            const result = await service.getPlaylistById("playlist-missing");

            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("should work without cache service", async () => {
            mockPlaylistRepo.getById.mockResolvedValue(fakePlaylist);
            const service = createService(false);

            const result = await service.getPlaylistById("playlist-1");

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(result).toEqual(fakePlaylist);
        });
    });

    // ── getPlaylistSongs() ───────────────────────────────────────────────────

    describe("getPlaylistSongs()", () => {
        const params = { page: 1, limit: 10 };

        it("should return cached songs on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(fakeSongsPaginatedResult);
            const service = createService();

            const result = await service.getPlaylistSongs("playlist-1", params);

            expect(mockCacheService.get).toHaveBeenCalledWith(
                "playlists:songs:id:playlist-1:page:1:limit:10",
            );
            expect(mockPlaylistRepo.getSongs).not.toHaveBeenCalled();
            expect(result).toEqual(fakeSongsPaginatedResult);
        });

        it("should call repository and cache with 600s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPlaylistRepo.getSongs.mockResolvedValue([fakeSong]);
            mockPlaylistRepo.countSongs.mockResolvedValue(1);
            const service = createService();

            const result = await service.getPlaylistSongs("playlist-1", params);

            expect(mockPlaylistRepo.getSongs).toHaveBeenCalledWith("playlist-1", 10, 0);
            expect(mockPlaylistRepo.countSongs).toHaveBeenCalledWith("playlist-1");
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "playlists:songs:id:playlist-1:page:1:limit:10",
                expect.objectContaining({ data: [fakeSong], total: 1 }),
                600,
            );
            expect(result.data).toEqual([fakeSong]);
        });

        it("should work without cache service", async () => {
            mockPlaylistRepo.getSongs.mockResolvedValue([fakeSong]);
            mockPlaylistRepo.countSongs.mockResolvedValue(1);
            const service = createService(false);

            const result = await service.getPlaylistSongs("playlist-1", params);

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([fakeSong]);
        });
    });

    // ── addSongToPlaylist() ──────────────────────────────────────────────────

    describe("addSongToPlaylist()", () => {
        const playlistSongData = { playlistId: "playlist-1", songId: "song-1" };

        it("should add song and invalidate playlist cache", async () => {
            mockPlaylistRepo.addSong.mockResolvedValue(playlistSongData);
            const service = createService();

            const result = await service.addSongToPlaylist(playlistSongData as any);

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("playlist-1", "playlistId");
            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
            expect(mockPlaylistRepo.addSong).toHaveBeenCalledWith(playlistSongData);
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:playlist-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
                "playlists:songs:id:playlist-1:*",
            );
            expect(result).toEqual(playlistSongData);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockPlaylistRepo.addSong.mockResolvedValue(playlistSongData);
            const service = createService(false);

            await service.addSongToPlaylist(playlistSongData as any);

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── removeSongFromPlaylist() ─────────────────────────────────────────────

    describe("removeSongFromPlaylist()", () => {
        const playlistSongData = { playlistId: "playlist-1", songId: "song-1" };

        it("should remove song and invalidate playlist cache", async () => {
            mockPlaylistRepo.removeSong.mockResolvedValue(playlistSongData);
            const service = createService();

            const result = await service.removeSongFromPlaylist(playlistSongData as any);

            expect(mockPlaylistRepo.removeSong).toHaveBeenCalledWith(playlistSongData);
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:playlist-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
                "playlists:songs:id:playlist-1:*",
            );
            expect(result).toEqual(playlistSongData);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockPlaylistRepo.removeSong.mockResolvedValue(playlistSongData);
            const service = createService(false);

            await service.removeSongFromPlaylist(playlistSongData as any);

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── createPlaylist() ─────────────────────────────────────────────────────

    describe("createPlaylist()", () => {
        const createData = { name: "New Playlist", description: "Description" };

        it("should create playlist and invalidate list cache", async () => {
            mockPlaylistRepo.create.mockResolvedValue({
                id: "new-playlist-id",
                ...createData,
            });
            const service = createService();

            const result = await service.createPlaylist(createData as any);

            expect(mockSignatureService.generateSignedId).toHaveBeenCalled();
            expect(mockPlaylistRepo.create).toHaveBeenCalledWith({
                id: "new-playlist-id",
                ...createData,
            });
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
            expect(result.id).toBe("new-playlist-id");
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockPlaylistRepo.create.mockResolvedValue({
                id: "new-playlist-id",
                ...createData,
            });
            const service = createService(false);

            await service.createPlaylist(createData as any);

            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── deletePlaylist() ─────────────────────────────────────────────────────

    describe("deletePlaylist()", () => {
        it("should delete playlist and invalidate all related caches", async () => {
            mockPlaylistRepo.delete.mockResolvedValue(fakePlaylist);
            const service = createService();

            const result = await service.deletePlaylist("playlist-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("playlist-1", "playlistId");
            expect(mockPlaylistRepo.delete).toHaveBeenCalledWith("playlist-1");
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:playlist-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
                "playlists:songs:id:playlist-1:*",
            );
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
            expect(result).toEqual(fakePlaylist);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockPlaylistRepo.delete.mockResolvedValue(fakePlaylist);
            const service = createService(false);

            await service.deletePlaylist("playlist-1");

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });

        it("should return the deleted playlist data", async () => {
            mockPlaylistRepo.delete.mockResolvedValue(fakePlaylist);
            const service = createService();

            const result = await service.deletePlaylist("playlist-1");

            expect(result).toEqual(fakePlaylist);
        });
    });
});
