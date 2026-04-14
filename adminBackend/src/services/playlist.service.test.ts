import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistService } from "./playlist.service";
import type { PlaylistRepository } from "../repository";
import type { SignatureService } from "../lib/signature";
import type { SearchService } from "../lib/search";
import type { Logger } from "../observablity";

describe("PlaylistService", () => {
    let service: PlaylistService;
    let mockPlaylistRepo: any;
    let mockSignature: any;
    let mockSearch: any;
    let mockLogger: any;

    beforeEach(() => {
        mockPlaylistRepo = {
            create: vi.fn(),
            getAll: vi.fn(),
            getById: vi.fn(),
            delete: vi.fn(),
            getSongs: vi.fn(),
            count: vi.fn(),
            countSongs: vi.fn(),
            addSong: vi.fn(),
            removeSong: vi.fn(),
        };
        mockSignature = {
            generateSignedId: vi.fn().mockReturnValue("signed-id"),
            verifyId: vi.fn(),
        };
        mockSearch = { save: vi.fn(), delete: vi.fn() };
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        service = new PlaylistService(
            mockPlaylistRepo as unknown as PlaylistRepository,
            mockSignature as unknown as SignatureService,
            mockSearch as unknown as SearchService,
            mockLogger as unknown as Logger
        );
    });

    describe("createPlaylist", () => {
        it("should create a playlist and sync to search", async () => {
            const input = { name: "Hits", coverImageKey: "c", bannerImageKey: "b" };
            const created = { id: "signed-id", ...input };
            mockPlaylistRepo.create.mockResolvedValue(created);

            const result = await service.createPlaylist(input);

            expect(result.id).toBe("signed-id");
            expect(mockPlaylistRepo.create).toHaveBeenCalled();
            expect(mockSearch.save).toHaveBeenCalled();
        });
    });

    describe("addSongToPlaylist", () => {
        it("should verify IDs and call repository", async () => {
            const data = { playlistId: "p1", songId: "s1" };
            mockPlaylistRepo.addSong.mockResolvedValue({ id: "entry-1", ...data });

            const result = await service.addSongToPlaylist(data);

            expect(result.playlistId).toBe("p1");
            expect(mockSignature.verifyId).toHaveBeenCalledWith("p1", "playlistId");
            expect(mockSignature.verifyId).toHaveBeenCalledWith("s1", "songId");
            expect(mockPlaylistRepo.addSong).toHaveBeenCalledWith(data);
        });
    });
});
