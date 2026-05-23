import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/infra")>();
    return {
        ...actual,
        playlistController: {
            getPlaylists: vi.fn(),
            getPlaylistById: vi.fn(),
            getSongsOfPlaylist: vi.fn(),
            deletePlaylist: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Playlist API E2E", () => {
    describe("GET /api/v1/playlists", () => {
        it("should return 200 and list of playlists", async () => {
            const mockResult = { data: [{ id: "p1", name: "Trending" }] };
            
            (infra.playlistController.getPlaylists as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Playlists fetched", data: mockResult });
            });

            const response = await request(app).get("/api/v1/playlists");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResult);
        });
    });

    describe("GET /api/v1/playlists/:id", () => {
        it("should return 200 and playlist details", async () => {
            const mockPlaylist = { id: "p1", name: "Trending" };
            
            (infra.playlistController.getPlaylistById as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Playlist fetched", data: mockPlaylist });
            });

            const response = await request(app).get("/api/v1/playlists/p1");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockPlaylist);
        });

        it("should return 404 if playlist not found", async () => {
            (infra.playlistController.getPlaylistById as any).mockImplementation((req: any, res: any) => {
                res.status(404).json({ success: false, message: "Playlist not found" });
            });

            const response = await request(app).get("/api/v1/playlists/non-existent");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/playlists/:id/songs", () => {
        it("should return 200 and list of songs in playlist", async () => {
            const mockSongs = { data: [{ id: "s1", title: "Song 1" }] };
            
            (infra.playlistController.getSongsOfPlaylist as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Songs fetched", data: mockSongs });
            });

            const response = await request(app).get("/api/v1/playlists/p1/songs");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockSongs);
        });

        it("should accept pagination query params for playlist songs", async () => {
            let capturedParams: any = null;
            (infra.playlistController.getSongsOfPlaylist as any).mockImplementation((req: any, res: any) => {
                capturedParams = req.query;
                res.status(200).json({ 
                    success: true, 
                    message: "Songs fetched", 
                    data: {
                        data: [],
                        pagination: { page: Number(req.query.page), limit: Number(req.query.limit), total: 0, totalPages: 0, hasNext: false, hasPrev: false }
                    } 
                });
            });

            const response = await request(app)
                .get("/api/v1/playlists/p1/songs")
                .query({ page: 3, limit: 15 });

            expect(response.status).toBe(200);
            expect(capturedParams).toEqual({ page: 3, limit: 15 });
            expect(response.body.data.pagination.page).toBe(3);
            expect(response.body.data.pagination.limit).toBe(15);
        });
    });
});
