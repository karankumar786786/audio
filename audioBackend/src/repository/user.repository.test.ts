import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepository } from "./user.repository";

describe("UserRepository", () => {
    let repo: UserRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() };
        repo = new UserRepository(mockDb, mockLogger);
    });

    const createMockUser = (overrides = {}) => ({
        id: "u1",
        email: "test@e.com",
        createdAt: new Date().toISOString(),
        ...overrides
    });

    it("should create user correctly", async () => {
        const mockUser = createMockUser({ id: "u2" });
        mockDb.mockResolvedValue([mockUser]);

        const result = await repo.create({ id: "u2", email: "test@e.com" });

        expect(result.id).toBe("u2");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should get user by id", async () => {
        const mockUser = createMockUser({ id: "u1" });
        mockDb.mockResolvedValue([mockUser]);

        const result = await repo.getById("u1");

        expect(result.id).toBe("u1");
        expect(result.email).toBe("test@e.com");
    });
});
