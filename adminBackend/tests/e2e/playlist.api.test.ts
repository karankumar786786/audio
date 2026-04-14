import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import * as infra from "../../src/infra";

vi.mock("../../src/infra", async () => {
  const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
  return {
    ...actual,
    playlistService: {
      createPlaylist: vi.fn(),
      getPlaylists: vi.fn(),
      getPlaylistById: vi.fn(),
      getPlaylistSongs: vi.fn(),
      deletePlaylist: vi.fn(),
      addSongToPlaylist: vi.fn(),
      removeSongFromPlaylist: vi.fn(),
    },
  };
});

describe("Playlist API E2E", () => {
  describe("POST /api/v1/playlists", () => {
    it("should return 201 on success", async () => {
      const mockResult = { id: "p1", name: "Hits" };
      (infra.playlistService.createPlaylist as any).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/v1/playlists")
        .send({ name: "Hits", coverImageKey: "c", bannerImageKey: "b" });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe("POST /api/v1/playlists/songs", () => {
    it("should return 201 on successful song addition", async () => {
      const mockResult = { id: "entry-1", playlistId: "p1", songId: "s1" };
      (infra.playlistService.addSongToPlaylist as any).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/v1/playlists/songs")
        .send({ playlistId: "p1", songId: "s1" });


      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe("GET /api/v1/playlists/:id/songs", () => {
    it("should return 200 and list of songs", async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (infra.playlistService.getPlaylistSongs as any).mockResolvedValue(mockResult);

      const response = await request(app).get("/api/v1/playlists/p1/songs");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
    });
  });
});
