import { inngest, audioProcessingService } from "../infra";

export const processExtractedFeatures = inngest.createFunction(
    { id: "process-extracted-features", triggers: [{ event: "audio/song.features.extracted" }] as any },
    async ({ event, step, logger }: any) => {
        const { jobId, songId, features } = event.data;
        
        await step.run("update-job-metadata", async () => {
            await audioProcessingService.extractFeatures(songId, {
                duration: features.duration,
                sampleRate: features.sample_rate,
                loudness: features.loudness,
                dynamicComplexity: features.dynamic_complexity,
                bpm: features.bpm,
                spectralCentroid: features.spectral_centroid,
                spectralFlux: features.spectral_flux,
                zeroCrossingRate: features.zero_crossing_rate,
            }, logger);
        });

        await step.sendEvent("trigger-recombee", {
            name: "audio/song.index.recombee",
            data: { jobId, songId }
        });

        return { status: "success", jobId, songId };
    }
);
