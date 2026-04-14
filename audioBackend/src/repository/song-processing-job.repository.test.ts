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

    it("should create a job correctly", async () => {
        const mockJob = {
            id: "job-1",
            status: "pending",
            title: "T1",
            artist_name: "A1",
            temp_song_key: "tmp/1.mp3",
            image_key: "img/1.jpg",
            song_id: null,
            created_at: new Date()
        };
        mockDb.mockResolvedValue([mockJob]);

        const result = await repo.create({
            id: "job-1",
            jobId: "job-id-1",
            title: "T1",
            artistName: "A1",
            tempSongKey: "tmp/1.mp3",
            imageKey: "img/1.jpg",
            transcoded: false,
            transcribed: false,
            extractedFeatures: false,
            savedInSearch: false,
            savedInRecommendation: false
        });

        expect(result!.id).toBe("job-1");
        expect(result!.status).toBe("pending");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should update status correctly", async () => {
        const mockJob = { id: "1", status: "completed" };
        mockDb.mockResolvedValue([mockJob]);

        const result = await repo.updateStatus("1", "completed", "final-song-id");

        expect(result!.status).toBe("completed");
        expect(mockDb).toHaveBeenCalled();
    });

    it("should fetch job by id", async () => {
        const mockJob = { id: "1", status: "processing" };
        mockDb.mockResolvedValue([mockJob]);

        const result = await repo.getById("1");

        expect(result!.id).toBe("1");
        expect(result!.status).toBe("processing");
    });
});
