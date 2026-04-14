import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async () => {
    const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
    return {
        ...actual,
        playlistController: {
            getSystemPlaylists: vi.fn(),
            getPlaylistById: vi.fn(),
            getSongs: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Playlist API E2E", () => {
    describe("GET /api/v1/playlists/system", () => {
        it("should return 200 and list of system playlists", async () => {
            const mockResult = [{ id: "p1", name: "Trending" }];
            
            (infra.playlistController.getSystemPlaylists as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Playlists fetched", data: mockResult });
            });

            const response = await request(app).get("/api/v1/playlists/system");

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
    });

    describe("GET /api/v1/playlists/:id/songs", () => {
        it("should return 200 and list of songs in playlist", async () => {
            const mockSongs = [{ id: "s1", title: "Song 1" }];
            
            (infra.playlistController.getSongs as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Songs fetched", data: mockSongs });
            });

            const response = await request(app).get("/api/v1/playlists/p1/songs");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockSongs);
        });
    });
});
