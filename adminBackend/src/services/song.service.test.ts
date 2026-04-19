import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "./song.service";
import type { SongRepository, SongProcessingJobRepository } from "../repository";
import type { SignatureService } from "../lib/signature";
import type { SearchService } from "../lib/search";
import type { RecommendationService } from "../lib/recommendation";
import type { Logger } from "../observablity";
import type { Inngest } from "inngest";

describe("SongService", () => {
    let service: SongService;
    let mockSongRepo: any;
    let mockJobRepo: any;
    let mockSignature: any;
    let mockSearch: any;
    let mockRecommendation: any;
    let mockStorage: any;
    let mockImageKit: any;
    let mockLogger: any;
    let mockInngest: any;

    beforeEach(() => {
        mockSongRepo = { 
            create: vi.fn(), 
            getById: vi.fn(), 
            getAll: vi.fn(), 
            count: vi.fn(), 
            update: vi.fn(), 
            delete: vi.fn() 
        };
        mockJobRepo = { create: vi.fn() };
        mockSignature = { 
            generateSignedId: vi.fn().mockReturnValue("signed-id"),
            verifyId: vi.fn()
        };
        mockSearch = { save: vi.fn(), delete: vi.fn() };
        mockRecommendation = { delete: vi.fn() };
        mockStorage = { uploadObject: vi.fn(), deleteObject: vi.fn() };
        mockImageKit = { upload: vi.fn() };
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };
        mockInngest = { send: vi.fn() };

        service = new SongService(
            mockSongRepo as unknown as any,
            mockJobRepo as unknown as any,
            mockSignature as unknown as any,
            mockSearch as unknown as any,
            mockRecommendation as unknown as any,
            mockStorage as unknown as any,
            mockImageKit as unknown as any,
            mockLogger as unknown as any,
            mockInngest as unknown as any
        );
    });

    describe("createSong", () => {
        it("should create a processing job and dispatch inngest event", async () => {
            const input = { title: "Title", artistName: "Artist", tempSongKey: "temp", imageKey: "img" };
            
            const result = await service.createSong(input);

            expect(result.status).toBe("pending");
            expect(mockJobRepo.create).toHaveBeenCalled();
            expect(mockInngest.send).toHaveBeenCalledWith(expect.objectContaining({
                name: "audio/song.transcode",
                data: expect.objectContaining({ jobId: "signed-id" })
            }));
        });
    });

    describe("deleteSong", () => {
        it("should delete from repo, search, and recommendation", async () => {
            mockSongRepo.delete.mockResolvedValue({ id: "1", title: "Deleted" });

            const result = await service.deleteSong("1");

            expect(result.id).toBe("1");
            expect(mockSignature.verifyId).toHaveBeenCalledWith("1", "songId");
            expect(mockSongRepo.delete).toHaveBeenCalledWith("1");
            expect(mockSearch.delete).toHaveBeenCalledWith("1");
            expect(mockRecommendation.delete).toHaveBeenCalledWith("1");
        });
    });
});
