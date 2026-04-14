import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongProcessingJobRepository } from "./song-processing-job.repository";

describe("SongProcessingJobRepository", () => {
    let repo: SongProcessingJobRepository;
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

        repo = new SongProcessingJobRepository(mockDb, mockLogger);
    });

    const createMockJob = (overrides = {}) => ({
        id: "j1",
        jobId: "job-123",
        title: "Test Job",
        artistName: "Artist",
        tempSongKey: "temp/1.mp3",
        imageKey: "img/1.jpg",
        status: "pending",
        transcoded: false,
        transcribed: false,
        extractedFeatures: false,
        savedInSearch: false,
        savedInRecommendation: false,
        ...overrides
    });

    it("should create a job correctly", async () => {
        const mockJob = createMockJob({ id: "j2" });
        mockDb.mockResolvedValue([mockJob]);

        const result = await repo.create({
            id: "j2",
            jobId: "job-123",
            title: "Test Job",
            artistName: "Artist",
            tempSongKey: "temp/1.mp3",
            imageKey: "img/1.jpg",
            transcoded: false,
            transcribed: false,
            extractedFeatures: false,
            savedInSearch: false,
            savedInRecommendation: false
        });

        expect(result.id).toBe("j2");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch job by id", async () => {
        const mockJob = createMockJob({ id: "1" });
        mockDb.mockImplementation((arg: any) => {
             return Promise.resolve([mockJob]);
        });

        const result = await repo.getById("1");
        expect(result!.id).toBe("1");
    });
});
