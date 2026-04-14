import { config } from "dotenv";
import { vi, beforeAll, afterAll, afterEach } from "vitest";

// Load test environment variables
config({ path: ".env.test" });

// Global Mocks
vi.mock("../src/observablity", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  logMethods: vi.fn(),
  getTraceId: vi.fn().mockReturnValue("test-trace-id"),
}));

beforeAll(() => {
  // Setup that runs before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

afterEach(() => {
  // Clear mocks after each test
  vi.clearAllMocks();
});
