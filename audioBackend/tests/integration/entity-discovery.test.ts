import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService, SongRepository, PlaylistService, PlaylistRepository } from "@onemelody/core";

describe("Entity Discovery Integration", () => {
    let songRepo: SongRepository;
    let songService: SongService;
    let playlistRepo: PlaylistRepository;
    let playlistService: PlaylistService;
    let mockDb: any;
    let mockResult: any;
    let mockLogger: any;
    let mockSig: any;

    beforeEach(() => {
        mockResult = [];
        mockDb = {
            select: vi.fn().mockImplementation((arg) => {
                const isCount = arg && typeof arg === 'object' && 'count' in arg;
                const selectChain: any = {
                    from: vi.fn().mockReturnThis(),
                    orderBy: vi.fn().mockReturnThis(),
                    $dynamic: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    offset: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    then: (onfulfilled: any) => Promise.resolve(isCount ? [{ count: 1 }] : mockResult).then(onfulfilled),
                    catch: (onrejected: any) => Promise.resolve(isCount ? [{ count: 1 }] : mockResult).catch(onrejected)
                };
                return selectChain;
            }),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockReturnThis(),
            then: (onfulfilled: any) => Promise.resolve(mockResult).then(onfulfilled),
            catch: (onrejected: any) => Promise.resolve(mockResult).catch(onrejected)
        };
        mockDb.from = vi.fn().mockReturnValue(mockDb);
        mockDb.orderBy = vi.fn().mockReturnValue(mockDb);
        mockDb.$dynamic = vi.fn().mockReturnValue(mockDb);
        mockDb.limit = vi.fn().mockReturnValue(mockDb);
        mockDb.offset = vi.fn().mockReturnValue(mockDb);
        mockDb.where = vi.fn().mockReturnValue(mockDb);
        mockDb.values = vi.fn().mockReturnValue(mockDb);
        mockDb.returning = vi.fn().mockReturnValue(mockDb);
        mockDb.set = vi.fn().mockReturnValue(mockDb);

        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        mockSig = { generateSignedId: vi.fn().mockReturnValue("signed-id"), verifyId: vi.fn() };
        
        songRepo = new SongRepository(mockDb, mockLogger, mockSig);
        songService = new SongService(songRepo, mockSig, mockLogger);
        
        playlistRepo = new PlaylistRepository(mockDb, mockLogger, mockSig);
        playlistService = new PlaylistService(playlistRepo, mockSig, mockLogger);
    });

    describe("Song Discovery", () => {
        it("should integrate Service and Repository to fetch paginated songs", async () => {
            const mockRows = [{ 
                id: "1", title: "S1", artistName: "A1", duration: 180, 
                songKey: "k1", imageKey: "i1", language: "en", jobId: "j1",
                createdAt: new Date().toISOString() 
            }];
            mockResult = mockRows;

            const result = await songService.getSongs({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.title).toBe("S1");
            expect(result.pagination.total).toBe(1);
        });
    });

    describe("Playlist Discovery", () => {
        it("should integrate Service and Repository to fetch playlists", async () => {
            const mockPlaylists = [{ 
                id: "p1", name: "Top Charts", 
                coverImageKey: "k1", bannerImageKey: "b1", 
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() 
            }];
            mockResult = mockPlaylists;

            const result = await playlistService.getPlaylists({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.name).toBe("Top Charts");
            expect(mockDb.select).toHaveBeenCalled();
        });
    });
});
