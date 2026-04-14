import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractionRepository } from "./interaction.repository";

describe("InteractionRepository", () => {
    let repo: InteractionRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };

        repo = new InteractionRepository(mockDb, mockLogger);
    });

    it("should fetch trending songs correctly", async () => {
        const mockSongs = [
            { id: "s1", title: "T1", artist_name: "A1", listen_count: 100 },
        ];
        mockDb.mockResolvedValue(mockSongs);

        const result = await repo.getTrendingSongs(10, 0);

        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe("s1");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch songs by ids", async () => {
        const mockRows = [{ id: "s1", title: "T1" }, { id: "s2", title: "T2" }];
        mockDb.mockResolvedValue(mockRows);

        const result = await repo.getSongsByIds(["s1", "s2"]);

        expect(result).toHaveLength(2);
        expect(result[0]!.id).toBe("s1");
    });

    it("should record listen correctly", async () => {
        mockDb.mockResolvedValue([{ id: "1" }]);
        const result = await repo.recordListen("u1", "s1");
        expect(result).toBeDefined();
        expect(mockDb).toHaveBeenCalled();
    });
});
