import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock infra to isolate the app
vi.mock("../../src/infra", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/infra")>();
    return {
        ...actual,
        authController: {
            register: vi.fn(),
            login: vi.fn(),
            resendOtp: vi.fn(),
            verifyOtp: vi.fn(),
            refreshToken: vi.fn(),
        },
    };
});

import { app } from "../../src/index";
import * as infra from "../../src/infra";

describe("Auth API E2E", () => {
    describe("POST /api/v1/auth/register", () => {
        it("should return 200 and session token when payload is valid", async () => {
            const mockResult = { token: "session-token-123" };
            
            (infra.authController.register as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "OTP sent to your email", data: mockResult });
            });

            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({ name: "John Doe", email: "john@example.com" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return 400 when email is invalid", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({ name: "John Doe", email: "invalid-email" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 when name is missing", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({ email: "john@example.com" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        it("should return 200 and session token when payload is valid", async () => {
            const mockResult = { token: "session-token-123" };
            
            (infra.authController.login as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "OTP sent to your email", data: mockResult });
            });

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: "john@example.com" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return 400 when email is missing", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/resend-otp", () => {
        it("should return 200 and new session token", async () => {
            const mockResult = { token: "new-session-token" };
            
            (infra.authController.resendOtp as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "OTP resent successfully", data: mockResult });
            });

            const response = await request(app)
                .post("/api/v1/auth/resend-otp")
                .send({ token: "session-token-123" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return 400 when token is missing", async () => {
            const response = await request(app)
                .post("/api/v1/auth/resend-otp")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/verify-otp", () => {
        it("should return 200 and tokens when payload is valid", async () => {
            const mockResult = { accessToken: "access-token-123", refreshToken: "refresh-token-123" };
            
            (infra.authController.verifyOtp as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "OTP verified successfully", data: mockResult });
            });

            const response = await request(app)
                .post("/api/v1/auth/verify-otp")
                .send({ token: "session-token-123", otp: "123456" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return 400 when OTP length is not 6", async () => {
            const response = await request(app)
                .post("/api/v1/auth/verify-otp")
                .send({ token: "session-token-123", otp: "1234" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/refresh-token", () => {
        it("should return 200 and new access token", async () => {
            const mockResult = { accessToken: "new-access-token-123" };
            
            (infra.authController.refreshToken as any).mockImplementation((req: any, res: any) => {
                res.status(200).json({ success: true, message: "Token refreshed successfully", data: mockResult });
            });

            const response = await request(app)
                .post("/api/v1/auth/refresh-token")
                .send({ refreshToken: "refresh-token-123" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult);
        });

        it("should return 400 when refresh token is missing", async () => {
            const response = await request(app)
                .post("/api/v1/auth/refresh-token")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
