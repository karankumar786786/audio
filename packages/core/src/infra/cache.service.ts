import Redis from "ioredis";
import { type Logger } from "../utils/index.ts";

export class CacheService {
    private readonly redis: Redis;

    constructor(private readonly logger?: Logger) {
        const connectionString = process.env.REDIS_URL || "rediss://default:gQAAAAAAAUeXAAIgcDEzYTkxY2I1YjljMTE0MTExOWZmZGM1NDM0MTQ2ZWNmYw@sunny-wildcat-83863.upstash.io:6379";
        this.redis = new Redis(connectionString, {
            maxRetriesPerRequest: 3,
        });

        this.redis.on("error", (err) => {
            if (this.logger) {
                this.logger.error({ err }, "Redis connection error");
            } else {
                console.error("Redis connection error:", err);
            }
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const val = await this.redis.get(key);
            if (!val) return null;
            return JSON.parse(val) as T;
        } catch (err) {
            if (this.logger) {
                this.logger.warn({ err, key }, "Failed to get key from Redis cache");
            }
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const stringVal = JSON.stringify(value);
            if (ttlSeconds && ttlSeconds > 0) {
                await this.redis.set(key, stringVal, "EX", ttlSeconds);
            } else {
                await this.redis.set(key, stringVal);
            }
        } catch (err) {
            if (this.logger) {
                this.logger.warn({ err, key }, "Failed to set key in Redis cache");
            }
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (err) {
            if (this.logger) {
                this.logger.warn({ err, key }, "Failed to delete key from Redis cache");
            }
        }
    }

    async delByPattern(pattern: string): Promise<void> {
        try {
            let cursor = "0";
            do {
                const [newCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
                cursor = newCursor;
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } while (cursor !== "0");
        } catch (err) {
            if (this.logger) {
                this.logger.warn({ err, pattern }, "Failed to delete pattern from Redis cache");
            }
        }
    }

    // Direct access to client if needed
    getClient(): Redis {
        return this.redis;
    }
}
