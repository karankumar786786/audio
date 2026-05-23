import { config } from "dotenv";
import { resolve } from "path";
import { vi, beforeEach } from "vitest";

// Fallback logic for DATABASE_URL
const res = config({ path: resolve(process.cwd(), ".env.test") });
if (res.error || !process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env") });
}

// Global mocks
vi.mock("express-rate-limit", () => {
  return {
    default: () => (req: any, res: any, next: any) => next()
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});


