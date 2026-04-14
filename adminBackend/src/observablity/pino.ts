import pino from "pino";
import pretty from "pino-pretty";

// ANSI colors for professional service identification
const COLORS = {
    ArtistService: "\u001b[32m",    // Green
    PlaylistService: "\u001b[34m",  // Blue
    SongService: "\u001b[35m",      // Magenta
    MiscService: "\u001b[36m",      // Cyan
    Repository: "\u001b[33m",      // Yellow
    Infra: "\u001b[90m",           // Gray
    Reset: "\u001b[0m",
    Bright: "\u001b[1m",
};

const stream = pretty({
    colorize: true,
    translateTime: "yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname,service",
    messageFormat: (log: any, messageKey: string) => {
        const service = (log.service as string) || "System";
        let color = COLORS.Infra;

        if (service.includes("Artist")) color = COLORS.ArtistService;
        else if (service.includes("Playlist")) color = COLORS.PlaylistService;
        else if (service.includes("Song")) color = COLORS.SongService;
        else if (service.includes("Misc")) color = COLORS.MiscService;
        else if (service.includes("Repository")) color = COLORS.Repository;

        const label = `${COLORS.Bright}${color}[${service}]${COLORS.Reset}`;
        return `${label} ${log[messageKey]}`;
    },
});

export const PinoLogger = pino(stream);
