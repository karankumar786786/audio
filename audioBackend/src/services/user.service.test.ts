import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user.service";

describe("UserService", () => {
    let service: UserService;
    let mockUserRepo: any;
    let mockFavRepo: any;
    let mockHistRepo: any;
    let mockSearchHistRepo: any;
    let mockSigService: any;
    let mockLogger: any;

    beforeEach(() => {
        mockUserRepo = { create: vi.fn(), getById: vi.fn(), getAll: vi.fn() };
        mockFavRepo = { create: vi.fn(), remove: vi.fn(), getByUserId: vi.fn() };
        mockHistRepo = { create: vi.fn(), getByUserId: vi.fn() };
        mockSearchHistRepo = { create: vi.fn(), getByUserId: vi.fn(), clearUserHistory: vi.fn() };
        mockSigService = { generateSignedId: vi.fn().mockReturnValue("signed-id") };
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };

        service = new UserService(
            mockUserRepo,
            mockFavRepo,
            mockHistRepo,
            mockSearchHistRepo,
            mockSigService,
            mockLogger
        );
    });

    it("should create user correctly", async () => {
        mockUserRepo.create.mockResolvedValue({ id: "1", email: "e" });
        const result = await service.createUser("1", "e");
        expect(result.id).toBe("1");
    });

    it("should add favourite with signed id", async () => {
        mockFavRepo.create.mockResolvedValue({ id: "signed-id" });
        const result = await service.addFavourite("u1", "s1");
        expect(result.id).toBe("signed-id");
        expect(mockSigService.generateSignedId).toHaveBeenCalled();
    });

    it("should save search history", async () => {
        mockSearchHistRepo.create.mockResolvedValue({ id: "signed-id" });
        await service.saveSearchHistory("u1", "query");
        expect(mockSearchHistRepo.create).toHaveBeenCalledWith({
            id: "signed-id",
            userId: "u1",
            searchedText: "query"
        });
    });
});
