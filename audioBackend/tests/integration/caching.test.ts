import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService, PlaylistService, ArtistService } from "@onemelody/core";

// ── Shared mock factories ────────────────────────────────────────────────────

function createMockLogger() {
    return {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        child: vi.fn().mockReturnThis(),
    };
}

function createMockSignatureService() {
    return {
        verifyId: vi.fn(),
        generateSignedId: vi.fn().mockReturnValue("test-id"),
    };
}

function createMockCacheService() {
    return {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        delByPattern: vi.fn(),
    };
}

// ── SongService Cache Integration ─────────────────────────────────────────────

describe("SongService Cache Integration", () => {
    let songService: SongService;
    let mockSongRepo: any;
    let mockSignatureService: ReturnType<typeof createMockSignatureService>;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let mockCacheService: ReturnType<typeof createMockCacheService>;

    const mockSongData = {
        id: "s1",
        title: "Test Song",
        artistName: "Test Artist",
        duration: 200,
        songKey: "songs/s1/master.m3u8",
        imageKey: "images/s1.jpg",
        language: "en",
        jobId: "j1",
        createdAt: new Date().toISOString(),
    };

    const mockPaginatedResult = {
        data: [mockSongData],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    beforeEach(() => {
        mockSongRepo = {
            getAll: vi.fn().mockResolvedValue([mockSongData]),
            count: vi.fn().mockResolvedValue(1),
            getById: vi.fn().mockResolvedValue(mockSongData),
            update: vi.fn().mockResolvedValue(mockSongData),
            delete: vi.fn().mockResolvedValue(mockSongData),
            getArtistSongs: vi.fn().mockResolvedValue([mockSongData]),
            countByArtistName: vi.fn().mockResolvedValue(1),
        };
        mockSignatureService = createMockSignatureService();
        mockLogger = createMockLogger();
        mockCacheService = createMockCacheService();

        songService = new SongService(
            mockSongRepo as any,
            mockSignatureService as any,
            mockLogger as any,
            undefined, // songProcessingJobRepository
            undefined, // searchService
            undefined, // recommendationService
            undefined, // storageService
            undefined, // imageKitClient
            undefined, // inngest
            mockCacheService as any,
        );
    });

    describe("getSongs()", () => {
        it("should return cached data on second call without hitting repository twice", async () => {
            // First call: cache miss → hits repo → stores in cache
            mockCacheService.get.mockResolvedValueOnce(null);

            const result1 = await songService.getSongs({ page: 1, limit: 10 });

            expect(result1.data).toHaveLength(1);
            expect(result1.data[0]!.title).toBe("Test Song");
            expect(mockSongRepo.getAll).toHaveBeenCalledTimes(1);
            expect(mockCacheService.get).toHaveBeenCalledWith("songs:list:page:1:limit:10");
            expect(mockCacheService.set).toHaveBeenCalledTimes(1);

            // Second call: cache hit → returns cached data, repo NOT called again
            mockCacheService.get.mockResolvedValueOnce(mockPaginatedResult);

            const result2 = await songService.getSongs({ page: 1, limit: 10 });

            expect(result2).toEqual(mockPaginatedResult);
            expect(mockSongRepo.getAll).toHaveBeenCalledTimes(1); // Still 1
            expect(mockCacheService.get).toHaveBeenCalledTimes(2);
        });

        it("should use TTL of 300s for song lists", async () => {
            mockCacheService.get.mockResolvedValue(null);

            await songService.getSongs({ page: 1, limit: 10 });

            expect(mockCacheService.set).toHaveBeenCalledWith(
                "songs:list:page:1:limit:10",
                expect.objectContaining({ data: expect.any(Array) }),
                300,
            );
        });

        it("should use different cache keys for different pagination params", async () => {
            mockCacheService.get.mockResolvedValue(null);

            await songService.getSongs({ page: 1, limit: 10 });
            await songService.getSongs({ page: 2, limit: 5 });

            expect(mockCacheService.get).toHaveBeenCalledWith("songs:list:page:1:limit:10");
            expect(mockCacheService.get).toHaveBeenCalledWith("songs:list:page:2:limit:5");
        });
    });

    describe("getSongById()", () => {
        it("should return cached song on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(mockSongData);

            const result = await songService.getSongById("s1");

            expect(result).toEqual(mockSongData);
            expect(mockSongRepo.getById).not.toHaveBeenCalled();
            expect(mockCacheService.get).toHaveBeenCalledWith("songs:id:s1");
        });

        it("should fetch from repo on cache miss and store with TTL 3600s", async () => {
            mockCacheService.get.mockResolvedValue(null);

            const result = await songService.getSongById("s1");

            expect(result).toEqual(mockSongData);
            expect(mockSongRepo.getById).toHaveBeenCalledWith("s1");
            expect(mockCacheService.set).toHaveBeenCalledWith("songs:id:s1", mockSongData, 3600);
        });

        it("should verify the ID signature before cache lookup", async () => {
            mockCacheService.get.mockResolvedValue(mockSongData);

            await songService.getSongById("s1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("s1", "songId");
        });
    });

    describe("updateSong()", () => {
        it("should invalidate individual song cache key after update", async () => {
            await songService.updateSong("s1", { title: "Updated Song" });

            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:s1");
        });

        it("should invalidate all song list cache keys after update", async () => {
            await songService.updateSong("s1", { title: "Updated Song" });

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
        });

        it("should invalidate cache AFTER repository update succeeds", async () => {
            const callOrder: string[] = [];
            mockSongRepo.update.mockImplementation(async () => {
                callOrder.push("repo.update");
                return mockSongData;
            });
            mockCacheService.del.mockImplementation(async () => {
                callOrder.push("cache.del");
            });
            mockCacheService.delByPattern.mockImplementation(async () => {
                callOrder.push("cache.delByPattern");
            });

            await songService.updateSong("s1", { title: "Updated" });

            expect(callOrder[0]).toBe("repo.update");
            expect(callOrder).toContain("cache.del");
            expect(callOrder).toContain("cache.delByPattern");
        });
    });

    describe("deleteSong()", () => {
        it("should invalidate individual song cache key after delete", async () => {
            await songService.deleteSong("s1");

            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:s1");
        });

        it("should invalidate all song list cache keys after delete", async () => {
            await songService.deleteSong("s1");

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
        });

        it("should verify the ID signature before deletion", async () => {
            await songService.deleteSong("s1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("s1", "songId");
        });
    });
});

// ── PlaylistService Cache Integration ─────────────────────────────────────────

describe("PlaylistService Cache Integration", () => {
    let playlistService: PlaylistService;
    let mockPlaylistRepo: any;
    let mockSignatureService: ReturnType<typeof createMockSignatureService>;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let mockCacheService: ReturnType<typeof createMockCacheService>;

    const mockPlaylist = {
        id: "p1",
        name: "Top Charts",
        description: "Best songs",
        coverImageKey: "img/cover.jpg",
        bannerImageKey: "img/banner.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockPaginatedPlaylists = {
        data: [mockPlaylist],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    const mockSongData = {
        id: "s1",
        title: "Song 1",
        artistName: "Artist 1",
        duration: 200,
        songKey: "songs/s1/master.m3u8",
        imageKey: "images/s1.jpg",
        language: "en",
        jobId: "j1",
        createdAt: new Date().toISOString(),
    };

    const mockPlaylistSong = {
        id: "ps1",
        playlistId: "p1",
        songId: "s1",
    };

    beforeEach(() => {
        mockPlaylistRepo = {
            getAll: vi.fn().mockResolvedValue([mockPlaylist]),
            count: vi.fn().mockResolvedValue(1),
            getById: vi.fn().mockResolvedValue(mockPlaylist),
            getSongs: vi.fn().mockResolvedValue([mockSongData]),
            countSongs: vi.fn().mockResolvedValue(1),
            addSong: vi.fn().mockResolvedValue(mockPlaylistSong),
            removeSong: vi.fn().mockResolvedValue(mockPlaylistSong),
            create: vi.fn().mockResolvedValue(mockPlaylist),
            delete: vi.fn().mockResolvedValue(mockPlaylist),
            update: vi.fn().mockResolvedValue(mockPlaylist),
        };
        mockSignatureService = createMockSignatureService();
        mockLogger = createMockLogger();
        mockCacheService = createMockCacheService();

        playlistService = new PlaylistService(
            mockPlaylistRepo as any,
            mockSignatureService as any,
            mockLogger as any,
            undefined, // searchService
            undefined, // imageKitClient
            mockCacheService as any,
        );
    });

    describe("getPlaylists() — cache-aside pattern", () => {
        it("should check cache first and return cached data on hit", async () => {
            mockCacheService.get.mockResolvedValue(mockPaginatedPlaylists);

            const result = await playlistService.getPlaylists({ page: 1, limit: 10 });

            expect(result).toEqual(mockPaginatedPlaylists);
            expect(mockPlaylistRepo.getAll).not.toHaveBeenCalled();
            expect(mockPlaylistRepo.count).not.toHaveBeenCalled();
        });

        it("should fetch from repo on cache miss and populate cache", async () => {
            mockCacheService.get.mockResolvedValue(null);

            const result = await playlistService.getPlaylists({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(mockPlaylistRepo.getAll).toHaveBeenCalledTimes(1);
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "playlists:list:page:1:limit:10",
                expect.objectContaining({ data: expect.any(Array) }),
                300,
            );
        });

        it("should use TTL of 300s for playlist lists", async () => {
            mockCacheService.get.mockResolvedValue(null);

            await playlistService.getPlaylists({ page: 1, limit: 10 });

            const setCall = mockCacheService.set.mock.calls[0];
            expect(setCall![2]).toBe(300);
        });
    });

    describe("getPlaylistById()", () => {
        it("should return cached playlist on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(mockPlaylist);

            const result = await playlistService.getPlaylistById("p1");

            expect(result).toEqual(mockPlaylist);
            expect(mockPlaylistRepo.getById).not.toHaveBeenCalled();
        });

        it("should use TTL of 3600s for individual playlist details", async () => {
            mockCacheService.get.mockResolvedValue(null);

            await playlistService.getPlaylistById("p1");

            expect(mockCacheService.set).toHaveBeenCalledWith("playlists:id:p1", mockPlaylist, 3600);
        });
    });

    describe("getPlaylistSongs() — cache-aside pattern", () => {
        it("should return cached tracklist on hit", async () => {
            const cachedSongs = {
                data: [mockSongData],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            };
            mockCacheService.get.mockResolvedValue(cachedSongs);

            const result = await playlistService.getPlaylistSongs("p1", { page: 1, limit: 10 });

            expect(result).toEqual(cachedSongs);
            expect(mockPlaylistRepo.getSongs).not.toHaveBeenCalled();
        });

        it("should use TTL of 600s for tracklists", async () => {
            mockCacheService.get.mockResolvedValue(null);

            await playlistService.getPlaylistSongs("p1", { page: 1, limit: 10 });

            expect(mockCacheService.set).toHaveBeenCalledWith(
                "playlists:songs:id:p1:page:1:limit:10",
                expect.any(Object),
                600,
            );
        });
    });

    describe("addSongToPlaylist()", () => {
        it("should invalidate playlist detail cache after adding song", async () => {
            await playlistService.addSongToPlaylist({ playlistId: "p1", songId: "s1" } as any);

            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
        });

        it("should invalidate tracklist cache after adding song", async () => {
            await playlistService.addSongToPlaylist({ playlistId: "p1", songId: "s1" } as any);

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
        });
    });

    describe("removeSongFromPlaylist()", () => {
        it("should invalidate playlist detail cache after removing song", async () => {
            await playlistService.removeSongFromPlaylist({ playlistId: "p1", songId: "s1" } as any);

            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
        });

        it("should invalidate tracklist cache after removing song", async () => {
            await playlistService.removeSongFromPlaylist({ playlistId: "p1", songId: "s1" } as any);

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
        });
    });

    describe("deletePlaylist()", () => {
        it("should invalidate playlist detail cache", async () => {
            await playlistService.deletePlaylist("p1");

            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
        });

        it("should invalidate tracklist cache", async () => {
            await playlistService.deletePlaylist("p1");

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
        });

        it("should invalidate playlist list cache", async () => {
            await playlistService.deletePlaylist("p1");

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
        });

        it("should invalidate all three cache categories on delete", async () => {
            await playlistService.deletePlaylist("p1");

            // Detail
            expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p1");
            // Tracklist
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p1:*");
            // Catalogue lists
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
        });
    });
});

// ── ArtistService Cache Integration ───────────────────────────────────────────

describe("ArtistService Cache Integration", () => {
    let artistService: ArtistService;
    let mockArtistRepo: any;
    let mockSongRepo2: any;
    let mockSignatureService: ReturnType<typeof createMockSignatureService>;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let mockCacheService: ReturnType<typeof createMockCacheService>;

    const mockArtist = {
        id: "a1",
        name: "Test Artist",
        about: "A great artist",
        dob: "1990-01-01",
        coverImageKey: "img/artist-cover.jpg",
        bannerImageKey: "img/artist-banner.jpg",
        createdAt: new Date().toISOString(),
    };

    const mockSongData = {
        id: "s1",
        title: "Song By Artist",
        artistName: "Test Artist",
        duration: 200,
        songKey: "songs/s1/master.m3u8",
        imageKey: "images/s1.jpg",
        language: "en",
        jobId: "j1",
        createdAt: new Date().toISOString(),
    };

    const mockPaginatedArtists = {
        data: [mockArtist],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    const mockPaginatedSongs = {
        data: [mockSongData],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    beforeEach(() => {
        mockArtistRepo = {
            getAll: vi.fn().mockResolvedValue([mockArtist]),
            count: vi.fn().mockResolvedValue(1),
            getById: vi.fn().mockResolvedValue(mockArtist),
            update: vi.fn().mockResolvedValue(mockArtist),
            delete: vi.fn().mockResolvedValue(mockArtist),
            create: vi.fn().mockResolvedValue(mockArtist),
        };
        mockSongRepo2 = {
            getArtistSongs: vi.fn().mockResolvedValue([mockSongData]),
            countByArtistName: vi.fn().mockResolvedValue(1),
        };
        mockSignatureService = createMockSignatureService();
        mockLogger = createMockLogger();
        mockCacheService = createMockCacheService();

        artistService = new ArtistService(
            mockArtistRepo as any,
            mockSongRepo2 as any,
            mockSignatureService as any,
            mockLogger as any,
            undefined, // searchService
            undefined, // imageKitClient
            mockCacheService as any,
        );
    });

    describe("getArtists() — cache-aside pattern", () => {
        it("should return cached data on cache hit without calling repo", async () => {
            mockCacheService.get.mockResolvedValue(mockPaginatedArtists);

            const result = await artistService.getArtists({ page: 1, limit: 10 });

            expect(result).toEqual(mockPaginatedArtists);
            expect(mockArtistRepo.getAll).not.toHaveBeenCalled();
            expect(mockArtistRepo.count).not.toHaveBeenCalled();
        });

        it("should fetch from repo on cache miss and populate cache with TTL 300s", async () => {
            mockCacheService.get.mockResolvedValue(null);

            const result = await artistService.getArtists({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(mockArtistRepo.getAll).toHaveBeenCalledTimes(1);
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "artists:list:page:1:limit:10",
                expect.objectContaining({ data: expect.any(Array) }),
                300,
            );
        });
    });

    describe("getArtistById()", () => {
        it("should return cached artist on hit", async () => {
            mockCacheService.get.mockResolvedValue(mockArtist);

            const result = await artistService.getArtistById("a1");

            expect(result).toEqual(mockArtist);
            expect(mockArtistRepo.getById).not.toHaveBeenCalled();
        });

        it("should fetch from repo on miss and cache with TTL 3600s", async () => {
            mockCacheService.get.mockResolvedValue(null);

            const result = await artistService.getArtistById("a1");

            expect(result).toEqual(mockArtist);
            expect(mockArtistRepo.getById).toHaveBeenCalledWith("a1");
            expect(mockCacheService.set).toHaveBeenCalledWith("artists:id:a1", mockArtist, 3600);
        });
    });

    describe("getArtistSongs() — cache-aside pattern", () => {
        it("should return cached songs on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(mockPaginatedSongs);

            const result = await artistService.getArtistSongs("a1", { page: 1, limit: 10 });

            expect(result).toEqual(mockPaginatedSongs);
            expect(mockSongRepo2.getArtistSongs).not.toHaveBeenCalled();
        });

        it("should fetch from repos on miss and populate cache with TTL 600s", async () => {
            mockCacheService.get.mockResolvedValue(null);

            const result = await artistService.getArtistSongs("a1", { page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(mockArtistRepo.getById).toHaveBeenCalledWith("a1");
            expect(mockSongRepo2.getArtistSongs).toHaveBeenCalledWith("Test Artist", 10, 0);
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "artists:songs:id:a1:page:1:limit:10",
                expect.any(Object),
                600,
            );
        });

        it("should use artist name from getById to query songs", async () => {
            mockCacheService.get.mockResolvedValue(null);
            const customArtist = { ...mockArtist, name: "Custom Name" };
            mockArtistRepo.getById.mockResolvedValue(customArtist);

            await artistService.getArtistSongs("a1", { page: 1, limit: 10 });

            expect(mockSongRepo2.getArtistSongs).toHaveBeenCalledWith("Custom Name", 10, 0);
        });
    });

    describe("updateArtist()", () => {
        it("should invalidate artist detail cache", async () => {
            await artistService.updateArtist("a1", { name: "Updated Artist" });

            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
        });

        it("should invalidate artist songs cache", async () => {
            await artistService.updateArtist("a1", { name: "Updated Artist" });

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
        });

        it("should invalidate artist list cache", async () => {
            await artistService.updateArtist("a1", { name: "Updated Artist" });

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
        });

        it("should invalidate all three cache categories on update", async () => {
            await artistService.updateArtist("a1", { name: "Updated" });

            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
        });
    });

    describe("deleteArtist()", () => {
        it("should invalidate artist detail cache", async () => {
            await artistService.deleteArtist("a1");

            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
        });

        it("should invalidate artist songs cache", async () => {
            await artistService.deleteArtist("a1");

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
        });

        it("should invalidate artist list cache", async () => {
            await artistService.deleteArtist("a1");

            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
        });

        it("should invalidate all three cache categories on delete", async () => {
            await artistService.deleteArtist("a1");

            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a1:*");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
        });

        it("should verify the ID signature before deletion", async () => {
            await artistService.deleteArtist("a1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("a1", "artistId");
        });
    });
});
