import { inngest, audioProcessingService } from "../infra";

export const importFromYoutube = inngest.createFunction(
    { id: "import-from-youtube", triggers: [{ event: "audio/song.import-from-youtube" }] as any },
    async ({ event, step, logger }: any) => {
        const { songId, jobId, ytUrl, title, artistName } = event.data;

        await step.run("import-audio-and-metadata", async () => {
            return await audioProcessingService.importFromYoutube(songId, { ytUrl, title, artistName }, logger);
        });

        await step.sendEvent("trigger-transcode", {
            name: "audio/song.transcode",
            data: {
                songId,
                jobId,
            },
        });

        return { songId, status: "imported" };
    }
);
