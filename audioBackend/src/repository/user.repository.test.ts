import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepository } from "./user.repository";

describe("UserRepository", () => {
    let repo: UserRepository;
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

        repo = new UserRepository(mockDb, mockLogger);
    });

    it("should create a user correctly", async () => {
        const mockUser = {
            id: "auth0|123",
            email: "test@example.com",
            created_at: new Date()
        };
        mockDb.mockResolvedValue([mockUser]);

        const result = await repo.create({
            id: "auth0|123",
            email: "test@example.com"
        });

        expect(result.id).toBe("auth0|123");
        expect(result.email).toBe("test@example.com");
    });

    it("should fetch user by id", async () => {
        const mockRow = { id: "1", email: "u1@e.com" };
        mockDb.mockResolvedValue([mockRow]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.email).toBe("u1@e.com");
    });

    it("should fetch all users", async () => {
        mockDb.mockResolvedValue([{ id: "1" }, { id: "2" }]);
        const result = await repo.getAll();
        expect(result).toHaveLength(2);
    });
});
