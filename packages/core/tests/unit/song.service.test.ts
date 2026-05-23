import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "../../src/services/song.service.ts";

describe("SongService Caching", () => {
  let mockSongRepo: any;
  let mockSignatureService: any;
  let mockLogger: any;
  let mockCacheService: any;
  let songService: SongService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSongRepo = {
      getAll: vi.fn(),
      count: vi.fn(),
      getById: vi.fn(),
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
      undefined, // songProcessingJobRepository
      undefined, // searchService
      undefined, // recommendationService
      undefined, // storageService
      undefined, // imageKitClient
      undefined, // inngest
      mockCacheService
    );
  });

  describe("getSongs", () => {
    const params = { page: 1, limit: 10 };
    const cacheKey = "songs:list:page:1:limit:10";
    const mockData = {
      data: [{ id: "song-1", title: "Song One" }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it("should return cached songs on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockData);

      const result = await songService.getSongs(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockSongRepo.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockSongRepo.getAll.mockResolvedValueOnce([{ id: "song-1", title: "Song One" }]);
      mockSongRepo.count.mockResolvedValueOnce(1);

      const result = await songService.getSongs(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockSongRepo.getAll).toHaveBeenCalledWith(10, 0);
      expect(mockSongRepo.count).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockData, 300);
      expect(result).toEqual(mockData);
    });

    it("should fetch from repo and not call cache if cacheService is undefined", async () => {
      const serviceNoCache = new SongService(
        mockSongRepo,
        mockSignatureService,
        mockLogger,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined // No Cache
      );
      mockSongRepo.getAll.mockResolvedValueOnce([{ id: "song-1", title: "Song One" }]);
      mockSongRepo.count.mockResolvedValueOnce(1);

      const result = await serviceNoCache.getSongs(params);

      expect(mockSongRepo.getAll).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(mockData);
    });
  });

  describe("getSongById", () => {
    const songId = "song-1";
    const cacheKey = "songs:id:song-1";
    const mockSong = { id: "song-1", title: "Song One" };

    it("should return cached song on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockSong);

      const result = await songService.getSongById(songId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(songId, "songId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockSongRepo.getById).not.toHaveBeenCalled();
      expect(result).toEqual(mockSong);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockSongRepo.getById.mockResolvedValueOnce(mockSong);

      const result = await songService.getSongById(songId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(songId, "songId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockSongRepo.getById).toHaveBeenCalledWith(songId);
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockSong, 3600);
      expect(result).toEqual(mockSong);
    });

    it("should fetch from repo and not call cache if cacheService is undefined", async () => {
      const serviceNoCache = new SongService(
        mockSongRepo,
        mockSignatureService,
        mockLogger,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined
      );
      mockSongRepo.getById.mockResolvedValueOnce(mockSong);

      const result = await serviceNoCache.getSongById(songId);

      expect(mockSongRepo.getById).toHaveBeenCalledWith(songId);
      expect(result).toEqual(mockSong);
    });
  });

  describe("updateSong", () => {
    const songId = "song-1";
    const updateInput = { title: "Updated Song Title" };
    const mockSong = { id: "song-1", title: "Updated Song Title" };

    it("should update song and invalidate cache keys", async () => {
      mockSongRepo.update.mockResolvedValueOnce(mockSong);

      const result = await songService.updateSong(songId, updateInput);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(songId, "songId");
      expect(mockSongRepo.update).toHaveBeenCalledWith(songId, updateInput);
      expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:song-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
      expect(result).toEqual(mockSong);
    });

    it("should update song without calling cache if cacheService is undefined", async () => {
      const serviceNoCache = new SongService(
        mockSongRepo,
        mockSignatureService,
        mockLogger,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined
      );
      mockSongRepo.update.mockResolvedValueOnce(mockSong);

      const result = await serviceNoCache.updateSong(songId, updateInput);

      expect(mockSongRepo.update).toHaveBeenCalledWith(songId, updateInput);
      expect(result).toEqual(mockSong);
    });
  });

  describe("deleteSong", () => {
    const songId = "song-1";
    const mockSong = { id: "song-1", title: "Song One", songKey: "songs/song-1.mp3", imageKey: "images/song-1.png" };

    it("should delete song and invalidate cache keys", async () => {
      mockSongRepo.delete.mockResolvedValueOnce(mockSong);

      const result = await songService.deleteSong(songId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(songId, "songId");
      expect(mockSongRepo.delete).toHaveBeenCalledWith(songId);
      expect(mockCacheService.del).toHaveBeenCalledWith("songs:id:song-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("songs:list:*");
      expect(result).toEqual(mockSong);
    });

    it("should delete song without calling cache if cacheService is undefined", async () => {
      const serviceNoCache = new SongService(
        mockSongRepo,
        mockSignatureService,
        mockLogger,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined
      );
      mockSongRepo.delete.mockResolvedValueOnce(mockSong);

      const result = await serviceNoCache.deleteSong(songId);

      expect(mockSongRepo.delete).toHaveBeenCalledWith(songId);
      expect(result).toEqual(mockSong);
    });
  });
});
