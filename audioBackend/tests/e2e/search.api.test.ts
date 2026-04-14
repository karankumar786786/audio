import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async () => {
    const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
    return {
        ...actual,
        searchController: {
            unifiedSearch: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Search API E2E", () => {
    describe("GET /api/v1/search/unified", () => {
        it("should return 200 and search results", async () => {
            const mockResult = {
                songs: [{ id: "s1", title: "Song 1" }],
                artists: [{ id: "a1", name: "Artist 1" }],
                playlists: [{ id: "p1", name: "Playlist 1" }]
            };
            
            (infra.searchController.unifiedSearch as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Search results", data: mockResult });
            });

            const response = await request(app)
                .get("/api/v1/search")
                .query({ query: "test" });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return empty results if query is empty", async () => {
            const emptyResult = { songs: [], artists: [], playlists: [] };
            (infra.searchController.unifiedSearch as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Search results", data: emptyResult });
            });

            const response = await request(app).get("/api/v1/search");

            expect(response.status).toBe(200);
            expect(response.body.data.songs).toHaveLength(0);
        });
    });
});
