import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongProcessingJobRepository } from "./song-processing-job.repository";
import { NotFoundError } from "../errors";

describe("SongProcessingJobRepository", () => {
    let repository: SongProcessingJobRepository;
    let mockDb: any;
    let mockLogger: any;

    beforeEach(() => {
        mockDb = vi.fn() as any;
        mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };
        repository = new SongProcessingJobRepository(mockDb, mockLogger);
    });

    describe("mapRow", () => {
        it("should map database rows to SongProcessingJob correctly", () => {
            const mockRow = {
                id: "1",
                job_id: "job-1",
                title: "Test Job",
                artist_name: "Artist",
                status: "pending",
                saved_in_search: true,
                transcoded: false,
            };

            const result = (repository as any).mapRow(mockRow);

            expect(result.id).toBe("1");
            expect(result.jobId).toBe("job-1");
            expect(result.status).toBe("pending");
            expect(result.savedInSearch).toBe(true);
            expect(result.transcoded).toBe(false);
        });
    });

    describe("getByStatus", () => {
        it("should return jobs filtered by status", async () => {
            const mockJobs = [{ id: "1", status: "pending" }];
            mockDb.mockResolvedValue(mockJobs);

            const result = await repository.getByStatus("pending");

            expect(result).toHaveLength(1);
            expect(result[0]!.id).toBe("1");
            expect(mockDb).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining("WHERE status = ")]), "pending");
        });
    });

    describe("update", () => {
        it("should update job and return mapped result", async () => {
             const updateData = { status: "completed" as any };
             mockDb.mockResolvedValue([{ id: "1", status: "completed" }]);

             const result = await repository.update("1", updateData);

             expect(result.status).toBe("completed");
             expect(mockDb).toHaveBeenCalled();
        }); 
    });
});
