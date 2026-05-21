import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, UserRepository, UserFavouriteSongRepository, UserHistoryRepository, UserSearchHistoryRepository, UserPlaylistRepository, NodeCryptoSignatureService } from "@onemelody/core";

describe("User Interactions Integration", () => {
    let userService: UserService;
    let userRepo: UserRepository;
    let favRepo: UserFavouriteSongRepository;
    let histRepo: UserHistoryRepository;
    let searchHistRepo: UserSearchHistoryRepository;
    let userPlaylistRepo: UserPlaylistRepository;
    let sigService: NodeCryptoSignatureService;
    let mockDb: any;
    let mockResult: any;
    let mockLogger: any;
    let mockRec: any;
    let mockJwt: any;

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
                    innerJoin: vi.fn().mockReturnThis(),
                    then: (onfulfilled: any) => Promise.resolve(isCount ? [{ count: 1 }] : mockResult).then(onfulfilled),
                    catch: (onrejected: any) => Promise.resolve(isCount ? [{ count: 1 }] : mockResult).catch(onrejected)
                };
                return selectChain;
            }),
            insert: vi.fn().mockImplementation(() => {
                const insertChain = {
                    values: vi.fn().mockReturnThis(),
                    onConflictDoUpdate: vi.fn().mockReturnThis(),
                    returning: vi.fn().mockImplementation(() => {
                        const arr = Array.isArray(mockResult) ? mockResult : [mockResult];
                        return Promise.resolve(arr);
                    }),
                    then: (onfulfilled: any) => {
                        const arr = Array.isArray(mockResult) ? mockResult : [mockResult];
                        return Promise.resolve(arr).then(onfulfilled);
                    }
                };
                return insertChain;
            }),
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
        sigService = new NodeCryptoSignatureService("test-secret");
        vi.spyOn(sigService, "verifyId").mockImplementation(() => {});
        
        userRepo = new UserRepository(mockDb, mockLogger, sigService);
        favRepo = new UserFavouriteSongRepository(mockDb, mockLogger, sigService);
        histRepo = new UserHistoryRepository(mockDb, mockLogger, sigService);
        searchHistRepo = new UserSearchHistoryRepository(mockDb, mockLogger, sigService);
        userPlaylistRepo = new UserPlaylistRepository(mockDb, mockLogger, sigService);
        mockRec = { addFavorite: vi.fn(), removeFavorite: vi.fn() };
        mockJwt = { sign: vi.fn(), verify: vi.fn() };
        
        userService = new UserService(
            userRepo,
            favRepo,
            histRepo,
            searchHistRepo,
            userPlaylistRepo,
            mockRec,
            sigService,
            mockLogger,
            mockJwt
        );
    });

    it("should integrate Service and Repositories to manage user favourites", async () => {
        const mockFav = { id: "1", userId: "u1", songId: "s1" };
        mockResult = [mockFav];

        const result = await userService.addFavourite("u1", "s1");

        expect(result.userId).toBe("u1");
        expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should integrate Service and Repositories to fetch user history", async () => {
        const mockRows = [{
            historyId: "h1",
            listenedAt: new Date().toISOString(),
            part: 100,
            id: "s1",
            title: "Test Song",
            artistName: "Test Artist",
            duration: 180,
            songKey: "songkey",
            imageKey: "imagekey",
            language: "en",
            jobId: "j1",
            createdAt: new Date().toISOString()
        }];
        mockResult = mockRows;

        const result = await userService.getHistory("u1", 10, 0);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.historyId).toBe("h1");
    });
});
