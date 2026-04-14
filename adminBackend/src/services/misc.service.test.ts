import { describe, it, expect, vi, beforeEach } from "vitest";
import { MiscService } from "./misc.service";
import type { StorageService } from "../lib/storage";
import type { SignatureService } from "../lib/signature";
import type ImageKit from "imagekit";
import type { Logger } from "../observablity";

describe("MiscService", () => {
    let service: MiscService;
    let mockStorage: any;
    let mockImageKit: any;
    let mockSignature: any;
    let mockLogger: any;

    beforeEach(() => {
        mockStorage = { getPresignedUrl: vi.fn().mockResolvedValue("test-url") };
        mockImageKit = { getAuthenticationParameters: vi.fn().mockReturnValue({ token: "t", expire: 0, signature: "s" }) };
        mockSignature = { generateSignedId: vi.fn().mockReturnValue("signed-id") };
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        service = new MiscService(
            mockLogger as unknown as Logger,
            mockStorage as unknown as StorageService,
            mockImageKit as unknown as ImageKit,
            mockSignature as unknown as SignatureService
        );
    });

    describe("getPresignedUrlSong", () => {
        it("should generate a signed key and fetch URL from storage service", async () => {
            const result = await service.getPresignedUrlSong();

            expect(result.key).toBe("signed-id");
            expect(result.url).toBe("test-url");
            expect(mockSignature.generateSignedId).toHaveBeenCalled();
            expect(mockStorage.getPresignedUrl).toHaveBeenCalled();
        });
    });

    describe("getPresignedUrlImage", () => {
        it("should return ImageKit auth parameters and a signed key", async () => {
            const result = await service.getPresignedUrlImage();

            expect(result.tempKey).toBe("signed-id");
            expect(result.token).toBe("t");
            expect(mockImageKit.getAuthenticationParameters).toHaveBeenCalled();
        });
    });
});
