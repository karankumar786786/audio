import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async () => {
    const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
    return {
        ...actual,
        songController: {
            getSongs: vi.fn(),
            getSongById: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Song API E2E", () => {
    describe("GET /api/v1/songs", () => {
        it("should return 200 and list of songs", async () => {
            const mockResult = { 
                data: [{ id: "s1", title: "Song 1" }], 
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
            };
            
            (infra.songController.getSongs as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Songs fetched", data: mockResult });
            });

            const response = await request(app).get("/api/v1/songs");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResult);
        });
    });

    describe("GET /api/v1/songs/:id", () => {
        it("should return 200 and song details", async () => {
            const mockSong = { id: "s1", title: "Song 1" };
            
            (infra.songController.getSongById as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Song fetched", data: mockSong });
            });

            const response = await request(app).get("/api/v1/songs/s1");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockSong);
        });

        it("should return 404 if song not found", async () => {
            (infra.songController.getSongById as any).mockImplementation((req: any, res: any) => {
                res.status(404).json({ success: false, message: "Song not found" });
            });

            const response = await request(app).get("/api/v1/songs/non-existent");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});
