import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import * as infra from "../../src/infra";

vi.mock("../../src/infra", async () => {
  const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
  return {
    ...actual,
    miscService: {
      getPresignedUrlSong: vi.fn(),
      getPresignedUrlImage: vi.fn(),
    },
  };
});

describe("Misc API E2E", () => {
  describe("GET /api/v1/misc/presigned-url/song", () => {
    it("should return 200 and presigned URL data", async () => {
      const mockResult = { key: "k1", url: "http://s3.url" };
      (infra.miscService.getPresignedUrlSong as any).mockResolvedValue(mockResult);

      const response = await request(app).get("/api/v1/misc/presigned-url/song");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe("GET /api/v1/misc/presigned-url/image", () => {
    it("should return 200 and ImageKit auth data", async () => {
      const mockResult = { tempKey: "k1", token: "t1", expire: 123, signature: "s1" };
      (infra.miscService.getPresignedUrlImage as any).mockResolvedValue(mockResult);

      const response = await request(app).get("/api/v1/misc/presigned-url/image");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
    });
  });
});

