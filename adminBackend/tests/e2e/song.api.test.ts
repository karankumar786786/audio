import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import * as infra from "../../src/infra";
import { ApiError } from "../../src/utils/ApiError";

// Mock the services in infra to avoid hitting real DB/External services
vi.mock("../../src/infra", async () => {
  const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
  return {
    ...actual,
    songService: {
      createSong: vi.fn(),
      getSongs: vi.fn(),
      updateSong: vi.fn(),
      deleteSong: vi.fn(),
    },
  };
});

describe("Song API E2E", () => {
  describe("POST /api/v1/songs", () => {
    it("should return 201 and job info on success", async () => {
      const mockResult = { id: "s1", jobId: "j1", status: "pending" };
      (infra.songService.createSong as any).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/v1/songs")
        .send({ title: "Song", artistName: "Artist", tempSongKey: "k", imageKey: "i" });

      expect(response.status).toBe(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    it("should return 400 on validation error", async () => {
      const response = await request(app)
        .post("/api/v1/songs")
        .send({ title: "" }); // Invalid

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/songs", () => {
    it("should return 200 and paginated songs", async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (infra.songService.getSongs as any).mockResolvedValue(mockResult);

      const response = await request(app).get("/api/v1/songs");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
    });
  });
});
