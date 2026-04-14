import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import * as infra from "../../src/infra";
import { ApiError } from "../../src/utils/ApiError";


// Mock the services in infra to avoid hitting real DB/Algolia
vi.mock("../../src/infra", async () => {
  const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
  return {
    ...actual,
    artistService: {
      getArtists: vi.fn(),
      getArtistById: vi.fn(),
      createArtist: vi.fn(),
      updateArtist: vi.fn(),
      deleteArtist: vi.fn(),
    },
  };
});


describe("Artist API E2E", () => {
  describe("GET /api/v1/artists", () => {
    it("should return 200 and a list of artists", async () => {
      const mockResult = {
        data: [{ id: "1", name: "E2E Artist" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      (infra.artistService.getArtists as any).mockResolvedValue(mockResult);
      const response = await request(app).get("/api/v1/artists");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe("GET /api/v1/artists/:id", () => {
    it("should return 404 if artist not found", async () => {
      (infra.artistService.getArtistById as any).mockRejectedValue(new ApiError(404, "Not found"));


      const response = await request(app).get("/api/v1/artists/999");

      expect(response.status).toBe(404);
    });
  });
});
