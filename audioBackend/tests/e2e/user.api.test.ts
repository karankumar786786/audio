import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async () => {
    const actual = await vi.importActual<typeof import("../../src/infra")>("../../src/infra");
    return {
        ...actual,
        userController: {
            createUser: vi.fn(),
            getUserById: vi.fn(),
            getUserSearchHistory: vi.fn(),
            saveUserSearchHistory: vi.fn(),
            clearUserSearchHistory: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("User API E2E", () => {
    describe("POST /api/v1/users", () => {
        it("should return 201 and created user", async () => {
            const mockUser = { id: "u1", email: "test@e.com" };
            
            (infra.userController.createUser as any).mockImplementation((req: any, res: any) => {
                res.status(201).json({ success: true, message: "User created", data: mockUser });
            });

            const response = await request(app)
                .post("/api/v1/users")
                .send({ id: "u1", email: "test@e.com" });

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(mockUser);
        });
    });

    describe("GET /api/v1/users/:id", () => {
        it("should return 200 and user data", async () => {
            const mockUser = { id: "u1", email: "test@e.com" };
            
            (infra.userController.getUserById as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "User fetched", data: mockUser });
            });

            const response = await request(app).get("/api/v1/users/u1");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockUser);
        });
    });

    describe("GET /api/v1/users/:userId/search-history", () => {
        it("should return 200 and search history", async () => {
            const mockHistory = { data: [{ id: "h1", searchedText: "rock" }] };
            
            (infra.userController.getUserSearchHistory as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "History fetched", data: mockHistory });
            });

            const response = await request(app).get("/api/v1/users/u1/search-history");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockHistory);
        });
    });
});
