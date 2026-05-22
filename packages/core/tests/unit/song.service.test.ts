import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "../../src/services/song.service.ts";

// ── Shared mocks ─────────────────────────────────────────────────────────────

const mockSongRepo = {
    getAll: vi.fn(),
    count: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockSignatureService = {
    verifyId: vi.fn(),
    generateSignedId: vi.fn().mockReturnValue("test-id"),
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

const fakeSong = {
    id: "song-1",
    title: "Test Song",
    artistName: "Test Artist",
    songKey: "songs/hls/test/master.m3u8",
    imageKey: "images/test.jpg",
};

const fakePaginatedResult = {
    data: [fakeSong],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
};

// ── Helper to create service ─────────────────────────────────────────────────

function createService(withCache = true) {
    return new SongService(
        mockSongRepo as any,
        mockSignatureService as any,
        mockLogger as any,
        undefined,  // songProcessingJobRepository
        undefined,  // searchService
        undefined,  // recommendationService
        undefined,  // storageService
        undefined,  // imageKitClient
        undefined,  // inngest
        withCache ? (mockCacheService as any) : undefined,
    );
}

describe("SongService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── getSongs() ───────────────────────────────────────────────────────────

    describe("getSongs()", () => {
        const params = { page: 1, limit: 10 };

        it("should return cached data on cache hit without calling repository", async () => {
            mockCacheService.get.mockResolvedValue(fakePaginatedResult);
            const service = createService();

            const result = await service.getSongs(params);

            expect(mockCacheService.get).toHaveBeenCalledWith("songs:list:page:1:limit:10");
            expect(mockSongRepo.getAll).not.toHaveBeenCalled();
            expect(mockSongRepo.count).not.toHaveBeenCalled();
            expect(result).toEqual(fakePaginatedResult);
        });

        it("should call repository and cache result with 300s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockSongRepo.getAll.mockResolvedValue([fakeSong]);
            mockSongRepo.count.mockResolvedValue(1);
            const service = createService();

            const result = await service.getSongs(params);

            expect(mockSongRepo.getAll).toHaveBeenCalledWith(10, 0);
            expect(mockSongRepo.count).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "songs:list:page:1:limit:10",
                expect.objectContaining({ data: [fakeSong], total: 1 }),
                300,
            );
            expect(result.data).toEqual([fakeSong]);
            expect(result.total).toBe(1);
        });

        it("should calculate offset correctly for page 2", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockSongRepo.getAll.mockResolvedValue([]);
            mockSongRepo.count.mockResolvedValue(0);
            const service = createService();

            await service.getSongs({ page: 2, limit: 20 });

            expect(mockSongRepo.getAll).toHaveBeenCalledWith(20, 20);
        });

        it("should work without cache service (cache undefined)", async () => {
            mockSongRepo.getAll.mockResolvedValue([fakeSong]);
            mockSongRepo.count.mockResolvedValue(1);
            const service = createService(false);

            const result = await service.getSongs(params);

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([fakeSong]);
        });
    });

    // ── getSongById() ────────────────────────────────────────────────────────

    describe("getSongById()", () => {
        it("should return cached song on cache hit without calling repository", async () => {
            mockCacheService.get.mockResolvedValue(fakeSong);
            const service = createService();

            const result = await service.getSongById("song-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
            expect(mockCacheService.get).toHaveBeenCalledWith("songs:id:song-1");
            expect(mockSongRepo.getById).not.toHaveBeenCalled();
            expect(result).toEqual(fakeSong);
        });

        it("should call repository and cache with 3600s TTL on cache miss", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockSongRepo.getById.mockResolvedValue(fakeSong);
            const service = createService();

            const result = await service.getSongById("song-1");

            expect(mockSongRepo.getById).toHaveBeenCalledWith("song-1");
            expect(mockCacheService.set).toHaveBeenCalledWith(
                "songs:id:song-1",
                fakeSong,
                3600,
            );
            expect(result).toEqual(fakeSong);
        });

        it("should not cache when repository returns null/undefined", async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockSongRepo.getById.mockResolvedValue(null);
            const service = createService();

            const result = await service.getSongById("song-missing");

            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("should work without cache service", async () => {
            mockSongRepo.getById.mockResolvedValue(fakeSong);
            const service = createService(false);

            const result = await service.getSongById("song-1");

            expect(mockCacheService.get).not.toHaveBeenCalled();
            expect(mockCacheService.set).not.toHaveBeenCalled();
            expect(result).toEqual(fakeSong);
        });
    });

    // ── updateSong() ─────────────────────────────────────────────────────────

    describe("updateSong()", () => {
        const updateData = { title: "Updated Title" };

        it("should update in repository and invalidate cache", async () => {
            const updatedSong = { ...fakeSong, title: "Updated Title" };
            mockSongRepo.update.mockResolvedValue(updatedSong);
            const service = createService();

            const result = await service.updateSong("song-1", updateData as any);

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
            expect(mockSongRepo.update).toHaveBeenCalledWith("song-1", updateData);
            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:song-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
            expect(result).toEqual(updatedSong);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockSongRepo.update.mockResolvedValue(fakeSong);
            const service = createService(false);

            await service.updateSong("song-1", updateData as any);

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });
    });

    // ── deleteSong() ─────────────────────────────────────────────────────────

    describe("deleteSong()", () => {
        it("should delete from repository and invalidate cache", async () => {
            const deletedSong = { ...fakeSong, songKey: null, imageKey: null };
            mockSongRepo.delete.mockResolvedValue(deletedSong);
            const service = createService();

            const result = await service.deleteSong("song-1");

            expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
            expect(mockSongRepo.delete).toHaveBeenCalledWith("song-1");
            expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:song-1");
            expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
            expect(result).toEqual(deletedSong);
        });

        it("should skip cache invalidation when cacheService is undefined", async () => {
            mockSongRepo.delete.mockResolvedValue({ ...fakeSong, songKey: null, imageKey: null });
            const service = createService(false);

            await service.deleteSong("song-1");

            expect(mockCacheService.del).not.toHaveBeenCalled();
            expect(mockCacheService.delByPattern).not.toHaveBeenCalled();
        });

        it("should return the deleted song data", async () => {
            mockSongRepo.delete.mockResolvedValue(fakeSong);
            const service = createService();

            const result = await service.deleteSong("song-1");

            expect(result).toEqual(fakeSong);
        });
    });
});
