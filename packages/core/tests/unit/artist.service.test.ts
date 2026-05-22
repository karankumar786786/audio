import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "../../src/services/artist.service.ts";

// ── Shared mocks ─────────────────────────────────────────────────────────────

const mockArtistRepo = {
    getAll: vi.fn(),
    count: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockSongRepo = {
    getArtistSongs: vi.fn(),
    countByArtistName: vi.fn(),
};

const mockSignatureService = {
    verifyId: vi.fn(),
    generateSignedId: vi.fn().mockReturnValue("new-artist-id"),
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

const fakeArtist = {
    id: "artist-1",
    name: "Test Artist",
    bio: "A great artist",
    coverImageKey: null,
    bannerImageKey: null,
};

const fakeSong = {
    id: "song-1",
    title: "Test Song",
    artistName: "Test Artist",
};

const fakePaginatedResult = {
    data: [fakeArtist],
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
    return new ArtistService(
        mockArtistRepo as any,
        mockSongRepo as any,
        mockSignatureService as any,
        mockLogger as any,
        undefined,  // searchService
        undefined,  // imageKitClient
        withCache ? (mockCacheService as any) : undefined,
    );
}

describe("ArtistService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── getArtists() ─────────────────────────────────────────────────────────

    describe("getArtists()", () => {
        const params = { page: 1, limit: 10 };

        it("should return cached data on cache hit without calling repository", async () => {
            mockCacheService.get.mockResolvedValue(fakePaginatedResult);
            const service = createService();

            const result = await service.getArtists(params);

            expect(mockCacheService.get).toHaveBeenCalledWith("artists:list:page:1:limit:10");
            expect(mockArtistRepo.getAll).not.toHaveBeenCalled();
            expect(mockArtistRepo.count).not.toHaveBeenCalled();
            expect(result).toEqual(fakePaginatedResult);
        });

        it("should call repository and cache result with 300s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockArtistRepo.getAll.mockResolvedValue([fakeArtist]);
            mockArtistRepo.count.mockResolvedValue(1);
            const service = createService();

            const result = await service.getArtists(params);

            expect(mockArtistRepo.getAll).toHaveBeenCalledWith(10, 0);
            expect(mockArtistRepo.count).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "artists:list:page:1:limit:10",
                expect.objectContaining({ data: [fakeArtist], total: 1 }),
                300,
            );
            expect(result.data).toEqual([fakeArtist]);
        });

        it("should calculate offset correctly for page 3", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockArtistRepo.getAll.mockResolvedValue([]);
            mockArtistRepo.count.mockResolvedValue(0);
            const service = createService();

            await service.getArtists({ page: 3, limit: 5 });

            expect(mockArtistRepo.getAll).toHaveBeenCalledWith(5, 10);
        });

        it("should work without cache service", async () => {
            mockArtistRepo.getAll.mockResolvedValue([fakeArtist]);
            mockArtistRepo.count.mockResolvedValue(1);
            const service = createService(false);

            const result = await service.getArtists(params);

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([fakeArtist]);
        });
    });

    // ── getArtistById() ──────────────────────────────────────────────────────

    describe("getArtistById()", () => {
        it("should return cached artist on cache hit without calling repository", async () => {
            mockCacheService.get.mockResolvedValue(fakeArtist);
            const service = createService();

            const result = await service.getArtistById("artist-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("artist-1", "artistId");
            expect(mockCacheService.get).toHaveBeenCalledWith("artists:id:artist-1");
            expect(mockArtistRepo.getById).not.toHaveBeenCalled();
            expect(result).toEqual(fakeArtist);
        });

        it("should call repository and cache with 3600s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockArtistRepo.getById.mockResolvedValue(fakeArtist);
            const service = createService();

            const result = await service.getArtistById("artist-1");

            expect(mockArtistRepo.getById).toHaveBeenCalledWith("artist-1");
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "artists:id:artist-1",
                fakeArtist,
                3600,
            );
            expect(result).toEqual(fakeArtist);
        });

        it("should not cache when repository returns null", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockArtistRepo.getById.mockResolvedValue(null);
            const service = createService();

            const result = await service.getArtistById("artist-missing");

            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("should work without cache service", async () => {
            mockArtistRepo.getById.mockResolvedValue(fakeArtist);
            const service = createService(false);

            const result = await service.getArtistById("artist-1");

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(result).toEqual(fakeArtist);
        });
    });

    // ── getArtistSongs() ─────────────────────────────────────────────────────

    describe("getArtistSongs()", () => {
        const params = { page: 1, limit: 10 };

        it("should return cached songs on cache hit", async () => {
            mockCacheService.get.mockResolvedValue(fakeSongsPaginatedResult);
            const service = createService();

            const result = await service.getArtistSongs("artist-1", params);

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("artist-1", "artistId");
            expect(mockCacheService.get).toHaveBeenCalledWith(
                "artists:songs:id:artist-1:page:1:limit:10",
            );
            expect(mockSongRepo.getArtistSongs).not.toHaveBeenCalled();
            expect(result).toEqual(fakeSongsPaginatedResult);
        });

        it("should fetch artist first, then get songs on cache miss with 600s TTL", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockArtistRepo.getById.mockResolvedValue(fakeArtist);
            mockSongRepo.getArtistSongs.mockResolvedValue([fakeSong]);
            mockSongRepo.countByArtistName.mockResolvedValue(1);
            const service = createService();

            const result = await service.getArtistSongs("artist-1", params);

            // Should fetch artist to get the name
            expect(mockArtistRepo.getById).toHaveBeenCalledWith("artist-1");
            // Then use the artist name for song queries
            expect(mockSongRepo.getArtistSongs).toHaveBeenCalledWith("Test Artist", 10, 0);
            expect(mockSongRepo.countByArtistName).toHaveBeenCalledWith("Test Artist");
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "artists:songs:id:artist-1:page:1:limit:10",
                expect.objectContaining({ data: [fakeSong], total: 1 }),
                600,
            );
            expect(result.data).toEqual([fakeSong]);
        });

        it("should work without cache service", async () => {
            mockArtistRepo.getById.mockResolvedValue(fakeArtist);
            mockSongRepo.getArtistSongs.mockResolvedValue([fakeSong]);
            mockSongRepo.countByArtistName.mockResolvedValue(1);
            const service = createService(false);

            const result = await service.getArtistSongs("artist-1", params);

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([fakeSong]);
        });
    });

    // ── createArtist() ───────────────────────────────────────────────────────

    describe("createArtist()", () => {
        const createData = { name: "New Artist", bio: "New bio" };

        it("should create artist and invalidate list cache", async () => {
            mockArtistRepo.create.mockResolvedValue({
                id: "new-artist-id",
                ...createData,
            });
            const service = createService();

            const result = await service.createArtist(createData as any);

            expect(mockSignatureService.generateSignedId).toHaveBeenCalled();
            expect(mockArtistRepo.create).toHaveBeenCalledWith({
                id: "new-artist-id",
                ...createData,
            });
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
            expect(result.id).toBe("new-artist-id");
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockArtistRepo.create.mockResolvedValue({
                id: "new-artist-id",
                ...createData,
            });
            const service = createService(false);

            await service.createArtist(createData as any);

            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── updateArtist() ───────────────────────────────────────────────────────

    describe("updateArtist()", () => {
        const updateData = { name: "Updated Artist" };

        it("should update artist and invalidate all related caches", async () => {
            const updatedArtist = { ...fakeArtist, name: "Updated Artist" };
            mockArtistRepo.update.mockResolvedValue(updatedArtist);
            const service = createService();

            const result = await service.updateArtist("artist-1", updateData);

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("artist-1", "artistId");
            expect(mockArtistRepo.update).toHaveBeenCalledWith("artist-1", updateData);
            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:artist-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
                "artists:songs:id:artist-1:*",
            );
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
            expect(result).toEqual(updatedArtist);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockArtistRepo.update.mockResolvedValue(fakeArtist);
            const service = createService(false);

            await service.updateArtist("artist-1", updateData);

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── deleteArtist() ───────────────────────────────────────────────────────

    describe("deleteArtist()", () => {
        it("should delete artist and invalidate all related caches", async () => {
            mockArtistRepo.delete.mockResolvedValue(fakeArtist);
            const service = createService();

            const result = await service.deleteArtist("artist-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("artist-1", "artistId");
            expect(mockArtistRepo.delete).toHaveBeenCalledWith("artist-1");
            expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:artist-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
                "artists:songs:id:artist-1:*",
            );
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
            expect(result).toEqual(fakeArtist);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockArtistRepo.delete.mockResolvedValue(fakeArtist);
            const service = createService(false);

            await service.deleteArtist("artist-1");

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });

        it("should return the deleted artist data", async () => {
            mockArtistRepo.delete.mockResolvedValue(fakeArtist);
            const service = createService();

            const result = await service.deleteArtist("artist-1");

            expect(result).toEqual(fakeArtist);
        });
    });
});
