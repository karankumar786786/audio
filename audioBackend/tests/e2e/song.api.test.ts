import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/infra")>();
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

        it("should accept pagination query params and pass them to controller", async () => {
            let capturedParams: any = null;
            (infra.songController.getSongs as any).mockImplementation((req: any, res: any) => {
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
                .get("/api/v1/songs")
                .query({ page: 2, limit: 5 });

            expect(response.status).toBe(200);
            expect(capturedParams).toEqual({ page: 2, limit: 5 });
            expect(response.body.data.pagination.page).toBe(2);
            expect(response.body.data.pagination.limit).toBe(5);
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
