import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/infra")>();
    return {
        ...actual,
        artistController: {
            getArtists: vi.fn(),
            getArtistById: vi.fn(),
            getSongsOfArtist: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Artist API E2E", () => {
    describe("GET /api/v1/artists", () => {
        it("should return 200 and list of artists", async () => {
            const mockResult = { 
                data: [{ id: "a1", name: "Artist One" }], 
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
            };
            (infra.artistController.getArtists as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Artists fetched", data: mockResult });
            });

            const response = await request(app).get("/api/v1/artists");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResult);
        });
    });

    describe("GET /api/v1/artists/:id", () => {
        it("should return 200 and artist details", async () => {
            const mockArtist = { id: "a1", name: "Artist One" };
            (infra.artistController.getArtistById as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Artist fetched", data: mockArtist });
            });

            const response = await request(app).get("/api/v1/artists/a1");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockArtist);
        });

        it("should return 404 if artist not found", async () => {
            (infra.artistController.getArtistById as any).mockImplementation((req: any, res: any) => {
                res.status(404).json({ success: false, message: "Artist not found" });
            });

            const response = await request(app).get("/api/v1/artists/non-existent");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/artists/:id/songs", () => {
        it("should return 200 and artist songs", async () => {
            const mockSongs = {
                data: [{ id: "s1", title: "Artist Song 1", artistName: "Artist One" }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
            };
            (infra.artistController.getSongsOfArtist as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Artist songs fetched", data: mockSongs });
            });

            const response = await request(app).get("/api/v1/artists/a1/songs");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockSongs);
        });
    });
});
