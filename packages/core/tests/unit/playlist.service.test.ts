import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistService } from "../../src/services/playlist.service.ts";

describe("PlaylistService Caching", () => {
  let mockPlaylistRepo: any;
  let mockSignatureService: any;
  let mockLogger: any;
  let mockCacheService: any;
  let playlistService: PlaylistService;

  beforeEach(() => {
    vi.clearAllMocks();

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

    mockSignatureService = {
      verifyId: vi.fn(),
      generateSignedId: vi.fn().mockReturnValue("signed-playlist-id"),
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

    playlistService = new PlaylistService(
      mockPlaylistRepo,
      mockSignatureService,
      mockLogger,
      undefined, // searchService
      undefined, // imageKitClient
      mockCacheService
    );
  });

  describe("getPlaylists", () => {
    const params = { page: 1, limit: 10 };
    const cacheKey = "playlists:list:page:1:limit:10";
    const mockData = {
      data: [{ id: "p-1", name: "Top Charts" }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it("should return cached playlists on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockData);

      const result = await playlistService.getPlaylists(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockPlaylistRepo.getAll.mockResolvedValueOnce([{ id: "p-1", name: "Top Charts" }]);
      mockPlaylistRepo.count.mockResolvedValueOnce(1);

      const result = await playlistService.getPlaylists(params);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getAll).toHaveBeenCalledWith(10, 0);
      expect(mockPlaylistRepo.count).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockData, 300);
      expect(result).toEqual(mockData);
    });
  });

  describe("getPlaylistById", () => {
    const playlistId = "p-1";
    const cacheKey = "playlists:id:p-1";
    const mockPlaylist = { id: "p-1", name: "Top Charts" };

    it("should return cached playlist on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockPlaylist);

      const result = await playlistService.getPlaylistById(playlistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(playlistId, "playlistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getById).not.toHaveBeenCalled();
      expect(result).toEqual(mockPlaylist);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockPlaylistRepo.getById.mockResolvedValueOnce(mockPlaylist);

      const result = await playlistService.getPlaylistById(playlistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(playlistId, "playlistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getById).toHaveBeenCalledWith(playlistId);
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockPlaylist, 3600);
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe("getPlaylistSongs", () => {
    const playlistId = "p-1";
    const params = { page: 1, limit: 10 };
    const cacheKey = "playlists:songs:id:p-1:page:1:limit:10";
    const mockSongs = {
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

    it("should return cached playlist songs on cache hit", async () => {
      mockCacheService.get.mockResolvedValueOnce(mockSongs);

      const result = await playlistService.getPlaylistSongs(playlistId, params);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(playlistId, "playlistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getSongs).not.toHaveBeenCalled();
      expect(result).toEqual(mockSongs);
    });

    it("should fetch from repo and set cache on cache miss", async () => {
      mockCacheService.get.mockResolvedValueOnce(null);
      mockPlaylistRepo.getSongs.mockResolvedValueOnce([{ id: "song-1", title: "Song One" }]);
      mockPlaylistRepo.countSongs.mockResolvedValueOnce(1);

      const result = await playlistService.getPlaylistSongs(playlistId, params);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(playlistId, "playlistId");
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockPlaylistRepo.getSongs).toHaveBeenCalledWith(playlistId, 10, 0);
      expect(mockPlaylistRepo.countSongs).toHaveBeenCalledWith(playlistId);
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockSongs, 600);
      expect(result).toEqual(mockSongs);
    });
  });

  describe("addSongToPlaylist", () => {
    const playlistSongInput = { playlistId: "p-1", songId: "song-1" };

    it("should add song to playlist and invalidate relevant caches", async () => {
      mockPlaylistRepo.addSong.mockResolvedValueOnce(playlistSongInput);

      const result = await playlistService.addSongToPlaylist(playlistSongInput);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith("p-1", "playlistId");
      expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
      expect(mockPlaylistRepo.addSong).toHaveBeenCalledWith(playlistSongInput);
      expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p-1:*");
      expect(result).toEqual(playlistSongInput);
    });
  });

  describe("removeSongFromPlaylist", () => {
    const playlistSongInput = { playlistId: "p-1", songId: "song-1" };

    it("should remove song from playlist and invalidate relevant caches", async () => {
      mockPlaylistRepo.removeSong.mockResolvedValueOnce(playlistSongInput);

      const result = await playlistService.removeSongFromPlaylist(playlistSongInput);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith("p-1", "playlistId");
      expect(mockSignatureService.verifyId).toHaveBeenCalledWith("song-1", "songId");
      expect(mockPlaylistRepo.removeSong).toHaveBeenCalledWith(playlistSongInput);
      expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p-1:*");
      expect(result).toEqual(playlistSongInput);
    });
  });

  describe("createPlaylist", () => {
    const createInput = { name: "New Playlist", isPublic: true };
    const mockPlaylist = { id: "signed-playlist-id", name: "New Playlist", isPublic: true };

    it("should create playlist and invalidate playlists list cache", async () => {
      mockPlaylistRepo.create.mockResolvedValueOnce(mockPlaylist);

      const result = await playlistService.createPlaylist(createInput);

      expect(mockPlaylistRepo.create).toHaveBeenCalledWith({ id: "signed-playlist-id", ...createInput });
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe("deletePlaylist", () => {
    const playlistId = "p-1";
    const mockPlaylist = { id: "p-1", name: "Top Charts", coverImageKey: "covers/p-1.png" };

    it("should delete playlist and invalidate all related caches", async () => {
      mockPlaylistRepo.delete.mockResolvedValueOnce(mockPlaylist);

      const result = await playlistService.deletePlaylist(playlistId);

      expect(mockSignatureService.verifyId).toHaveBeenCalledWith(playlistId, "playlistId");
      expect(mockPlaylistRepo.delete).toHaveBeenCalledWith(playlistId);
      expect(mockCacheService.del).toHaveBeenCalledWith("playlists:id:p-1");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:songs:id:p-1:*");
      expect(mockCacheService.delByPattern).toHaveBeenCalledWith("playlists:list:*");
      expect(result).toEqual(mockPlaylist);
    });
  });
});
