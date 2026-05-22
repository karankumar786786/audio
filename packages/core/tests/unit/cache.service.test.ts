import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock ioredis before importing CacheService ──────────────────────────────
const mockRedisInstance = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scan: vi.fn(),
    on: vi.fn(),
};

vi.mock("ioredis", () => {
    return {
        default: vi.fn(() => mockRedisInstance),
    };
});

import { CacheService } from "../../src/infra/cache.service.ts";

// ── Helpers ─────────────────────────────────────────────────────────────────
const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    child: vi.fn().mockReturnThis(),
};

describe("CacheService", () => {
    let cache: CacheService;

    beforeEach(() => {
        vi.clearAllMocks();
        cache = new CacheService(mockLogger as any);
    });

    // ── Constructor ──────────────────────────────────────────────────────────

    describe("constructor", () => {
        it("should register a Redis error handler via on('error')", () => {
            expect(mockRedisInstance.on).toHaveBeenCalledWith(
                "error",
                expect.any(Function),
            );
        });

        it("should log Redis connection errors when logger is provided", () => {
            // Grab the error handler that was registered
            const errorHandler = mockRedisInstance.on.mock.calls.find(
                (c: any[]) => c[0] === "error",
            )![1];
            const testError = new Error("connection lost");
            errorHandler(testError);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { err: testError },
                "Redis connection error",
            );
        });

        it("should fall back to console.error when no logger is provided", () => {
            vi.clearAllMocks();
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const cacheNoLogger = new CacheService();
            const errorHandler = mockRedisInstance.on.mock.calls.find(
                (c: any[]) => c[0] === "error",
            )![1];
            const testError = new Error("oops");
            errorHandler(testError);
            expect(consoleSpy).toHaveBeenCalledWith("Redis connection error:", testError);
            consoleSpy.mockRestore();
        });
    });

    // ── get() ────────────────────────────────────────────────────────────────

    describe("get()", () => {
        it("should return parsed JSON on cache hit", async () => {
            const data = { id: "1", name: "Test Song" };
            mockRedisInstance.get.mockResolvedValue(JSON.stringify(data));

            const result = await cache.get<typeof data>("songs:id:1");

            expect(mockRedisInstance.get).toHaveBeenCalledWith("songs:id:1");
            expect(result).toEqual(data);
        });

        it("should return null on cache miss (null value)", async () => {
            mockRedisInstance.get.mockResolvedValue(null);

            const result = await cache.get("songs:id:999");

            expect(result).toBeNull();
        });

        it("should return null on cache miss (empty string)", async () => {
            mockRedisInstance.get.mockResolvedValue("");

            const result = await cache.get("songs:id:empty");

            expect(result).toBeNull();
        });

        it("should return null gracefully on JSON parse error", async () => {
            mockRedisInstance.get.mockResolvedValue("not-valid-json{{{");

            const result = await cache.get("bad-key");

            expect(result).toBeNull();
        });

        it("should return null and log warning when Redis throws", async () => {
            mockRedisInstance.get.mockRejectedValue(new Error("timeout"));

            const result = await cache.get("failing-key");

            expect(result).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ key: "failing-key" }),
                "Failed to get key from Redis cache",
            );
        });
    });

    // ── set() ────────────────────────────────────────────────────────────────

    describe("set()", () => {
        it("should call redis.set with EX when ttlSeconds > 0", async () => {
            mockRedisInstance.set.mockResolvedValue("OK");

            await cache.set("key1", { foo: "bar" }, 300);

            expect(mockRedisInstance.set).toHaveBeenCalledWith(
                "key1",
                JSON.stringify({ foo: "bar" }),
                "EX",
                300,
            );
        });

        it("should call redis.set without EX when ttlSeconds is undefined", async () => {
            mockRedisInstance.set.mockResolvedValue("OK");

            await cache.set("key2", [1, 2, 3]);

            expect(mockRedisInstance.set).toHaveBeenCalledWith(
                "key2",
                JSON.stringify([1, 2, 3]),
            );
        });

        it("should call redis.set without EX when ttlSeconds is 0", async () => {
            mockRedisInstance.set.mockResolvedValue("OK");

            await cache.set("key3", "hello", 0);

            expect(mockRedisInstance.set).toHaveBeenCalledWith(
                "key3",
                JSON.stringify("hello"),
            );
        });

        it("should call redis.set without EX when ttlSeconds is negative", async () => {
            mockRedisInstance.set.mockResolvedValue("OK");

            await cache.set("key4", "hello", -10);

            expect(mockRedisInstance.set).toHaveBeenCalledWith(
                "key4",
                JSON.stringify("hello"),
            );
        });

        it("should handle Redis set errors gracefully", async () => {
            mockRedisInstance.set.mockRejectedValue(new Error("write fail"));

            // Should not throw
            await expect(cache.set("key5", "val", 60)).resolves.toBeUndefined();

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ key: "key5" }),
                "Failed to set key in Redis cache",
            );
        });
    });

    // ── del() ────────────────────────────────────────────────────────────────

    describe("del()", () => {
        it("should call redis.del with the given key", async () => {
            mockRedisInstance.del.mockResolvedValue(1);

            await cache.del("songs:id:1");

            expect(mockRedisInstance.del).toHaveBeenCalledWith("songs:id:1");
        });

        it("should handle Redis del errors gracefully", async () => {
            mockRedisInstance.del.mockRejectedValue(new Error("del fail"));

            await expect(cache.del("failing-key")).resolves.toBeUndefined();

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ key: "failing-key" }),
                "Failed to delete key from Redis cache",
            );
        });
    });

    // ── delByPattern() ───────────────────────────────────────────────────────

    describe("delByPattern()", () => {
        it("should scan and delete keys matching the pattern in a single iteration", async () => {
            mockRedisInstance.scan.mockResolvedValue(["0", ["k1", "k2", "k3"]]);
            mockRedisInstance.del.mockResolvedValue(3);

            await cache.delByPattern("songs:list:*");

            expect(mockRedisInstance.scan).toHaveBeenCalledWith(
                "0", "MATCH", "songs:list:*", "COUNT", 100,
            );
            expect(mockRedisInstance.del).toHaveBeenCalledWith("k1", "k2", "k3");
        });

        it("should handle multiple scan iterations", async () => {
            // First scan returns cursor "42" (not done) with some keys
            mockRedisInstance.scan
                .mockResolvedValueOnce(["42", ["a", "b"]])
                .mockResolvedValueOnce(["0", ["c"]]);
            mockRedisInstance.del.mockResolvedValue(1);

            await cache.delByPattern("prefix:*");

            expect(mockRedisInstance.scan).toHaveBeenCalledTimes(2);
            expect(mockRedisInstance.del).toHaveBeenCalledTimes(2);
            expect(mockRedisInstance.del).toHaveBeenCalledWith("a", "b");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("c");
        });

        it("should not call del when scan returns empty keys", async () => {
            mockRedisInstance.scan.mockResolvedValue(["0", []]);

            await cache.delByPattern("empty:*");

            expect(mockRedisInstance.scan).toHaveBeenCalledTimes(1);
            expect(mockRedisInstance.del).not.toHaveBeenCalled();
        });

        it("should handle scan errors gracefully", async () => {
            mockRedisInstance.scan.mockRejectedValue(new Error("scan fail"));

            await expect(cache.delByPattern("bad:*")).resolves.toBeUndefined();

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ pattern: "bad:*" }),
                "Failed to delete pattern from Redis cache",
            );
        });
    });

    // ── getClient() ──────────────────────────────────────────────────────────

    describe("getClient()", () => {
        it("should return the Redis client instance", () => {
            const client = cache.getClient();
            expect(client).toBe(mockRedisInstance);
        });
    });
});
