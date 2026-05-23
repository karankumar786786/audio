import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "../../src/services/artist.service.ts";

describe("ArtistService Caching", () => {
  let mockArtistRepo: any;
  let mockSongRepo: any;
  let mockSignatureService: any;
  let mockLogger: any;
  let mockCacheService: any;
  let artistService: ArtistService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockArtistRepo = {
      getAll: vi.fn(),
      count: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockSongRepo = {
      getArtistSongs: vi.fn(),
      countByArtistName: vi.fn(),
    };

    mockSignatureService = {
      verifyId: vi.fn(),
      generateSignedId: vi.fn().mockReturnValue("signed-artist-id"),
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

    artistService = new ArtistService(
      mockArtistRepo,
      mockSongRepo,
      mockSignatureService,
      mockLogger,
      undefined, // searchService
      undefined, // imageKitClient
      mockCacheService
    );
  });

  describe("getArtists", () => {
    const params = { page: 1, limit: 10 };
    const cacheKey = "artists:list:page:1:limit:10";
    const mockData = {
      data: [{ id: "a-1", name: "Artist One" }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it("should return cached artists on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockData);

      const result = await artistService.getArtists(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockArtistRepo.getAll.mockResolvedValueOnce([{ id: "a-1", name: "Artist One" }]);
      mockArtistRepo.count.mockResolvedValueOnce(1);

      const result = await artistService.getArtists(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getAll).toHaveBeenCalledWith(10, 0);
      expect(mockArtistRepo.count).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockData, 300);
      expect(result).toEqual(mockData);
    });
  });

  describe("getArtistById", () => {
    const artistId = "a-1";
    const cacheKey = "artists:id:a-1";
    const mockArtist = { id: "a-1", name: "Artist One" };

    it("should return cached artist on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockArtist);

      const result = await artistService.getArtistById(artistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getById).not.toHaveBeenCalled();
      expect(result).toEqual(mockArtist);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockArtistRepo.getById.mockResolvedValueOnce(mockArtist);

      const result = await artistService.getArtistById(artistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getById).toHaveBeenCalledWith(artistId);
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockArtist, 3600);
      expect(result).toEqual(mockArtist);
    });
  });

  describe("getArtistSongs", () => {
    const artistId = "a-1";
    const params = { page: 1, limit: 10 };
    const cacheKey = "artists:songs:id:a-1:page:1:limit:10";
    const mockSongs = {
      data: [{ id: "song-1", title: "Song One", artistName: "Artist One" }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it("should return cached artist songs on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockSongs);

      const result = await artistService.getArtistSongs(artistId, params);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getById).not.toHaveBeenCalled();
      expect(mockSongRepo.getArtistSongs).not.toHaveBeenCalled();
      expect(result).toEqual(mockSongs);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockArtistRepo.getById.mockResolvedValueOnce({ id: "a-1", name: "Artist One" });
      mockSongRepo.getArtistSongs.mockResolvedValueOnce([{ id: "song-1", title: "Song One", artistName: "Artist One" }]);
      mockSongRepo.countByArtistName.mockResolvedValueOnce(1);

      const result = await artistService.getArtistSongs(artistId, params);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockArtistRepo.getById).toHaveBeenCalledWith(artistId);
      expect(mockSongRepo.getArtistSongs).toHaveBeenCalledWith("Artist One", 10, 0);
      expect(mockSongRepo.countByArtistName).toHaveBeenCalledWith("Artist One");
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockSongs, 600);
      expect(result).toEqual(mockSongs);
    });
  });

  describe("createArtist", () => {
    const createInput = { name: "New Artist", description: "Hello" };
    const mockArtist = { id: "signed-artist-id", name: "New Artist", description: "Hello" };

    it("should create artist and invalidate artists list cache", async () => {
      mockArtistRepo.create.mockResolvedValueOnce(mockArtist);

      const result = await artistService.createArtist(createInput);

      expect(mockArtistRepo.create).toHaveBeenCalledWith({ id: "signed-artist-id", ...createInput });
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
      expect(result).toEqual(mockArtist);
    });
  });

  describe("updateArtist", () => {
    const artistId = "a-1";
    const updateInput = { name: "Updated Artist Name" };
    const mockArtist = { id: "a-1", name: "Updated Artist Name" };

    it("should update artist and invalidate relevant caches", async () => {
      mockArtistRepo.update.mockResolvedValueOnce(mockArtist);

      const result = await artistService.updateArtist(artistId, updateInput);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockArtistRepo.update).toHaveBeenCalledWith(artistId, updateInput);
      expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a-1:*");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
      expect(result).toEqual(mockArtist);
    });
  });

  describe("deleteArtist", () => {
    const artistId = "a-1";
    const mockArtist = { id: "a-1", name: "Artist One", coverImageKey: "covers/a-1.png" };

    it("should delete artist and invalidate all related caches", async () => {
      mockArtistRepo.delete.mockResolvedValueOnce(mockArtist);

      const result = await artistService.deleteArtist(artistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(artistId, "artistId");
      expect(mockArtistRepo.delete).toHaveBeenCalledWith(artistId);
      expect(mockCacheService.del).toHaveBeenCalledWith("artists:id:a-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:songs:id:a-1:*");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("artists:list:*");
      expect(result).toEqual(mockArtist);
    });
  });
});
