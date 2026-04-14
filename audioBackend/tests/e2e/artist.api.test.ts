import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Using dynamic import/mocking for infra to isolate the app
vi.mock("../../src/infra", async () => {
    const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
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
                data: [], 
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } 
            };
            (infra.artistController.getArtists as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Artists fetched", data: mockResult });
            });


            const response = await request(app).get("/api/v1/artists");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResult);

        });
    });
});
