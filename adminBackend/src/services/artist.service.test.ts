import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "./artist.service";
import { type ArtistRepository } from "../repository/artist.repository";
import { type SongRepository } from "../repository/song.repository";
import { type SignatureService } from "../lib/signature/index.types";
import { type SearchService } from "../lib/search";
import { type Logger } from "../observablity";

describe("ArtistService", () => {
  let artistService: ArtistService;
  let mockArtistRepo: any;
  let mockSongRepo: any;
  let mockSignatureService: any;
  let mockSearchService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockArtistRepo = {
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
    };
    mockSongRepo = {
        getByArtistId: vi.fn(),
    };
    mockSignatureService = {
      generateSignedId: vi.fn().mockReturnValue("test-sig"),
      verifyId: vi.fn(),
    };
    mockSearchService = {
      save: vi.fn(),
      delete: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    };

    artistService = new ArtistService(
      mockArtistRepo as unknown as ArtistRepository,
      mockSongRepo as unknown as SongRepository,
      mockSignatureService as unknown as SignatureService,
      mockSearchService as unknown as SearchService,
      mockLogger as unknown as Logger
    );

  });

  describe("getArtistById", () => {
    it("should return an artist if found", async () => {
      const mockArtist = { id: "1", name: "Test Artist" };
      mockArtistRepo.getById.mockResolvedValue(mockArtist);

      const result = await artistService.getArtistById("1");

      expect(result).toEqual(mockArtist);
      expect(mockArtistRepo.getById).toHaveBeenCalledWith("1");
    });

    it("should throw if repo throws", async () => {
      mockArtistRepo.getById.mockRejectedValue(new Error("Not found"));

      await expect(artistService.getArtistById("1")).rejects.toThrow("Not found");
    });
  });

  describe("createArtist", () => {
    it("should create an artist and index in search", async () => {
        const input = { name: "New Artist", about: "Bio", dob: "1990-01-01" };
        const createdArtist = { id: "test-sig", ...input };
        mockArtistRepo.create.mockResolvedValue(createdArtist);

        const result = await artistService.createArtist(input as any);

        expect(result).toEqual(createdArtist);
        expect(mockArtistRepo.create).toHaveBeenCalled();
        expect(mockSearchService.save).toHaveBeenCalledWith(expect.objectContaining({ id: "test-sig" }));
    });
  });

});
