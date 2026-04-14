import pino from "pino";
import pretty from "pino-pretty";

// ANSI colors for professional service identification
const COLORS = {
    ArtistService: "\u001b[32m",    // Green
    PlaylistService: "\u001b[34m",  // Blue
    SongService: "\u001b[35m",      // Magenta
    MiscService: "\u001b[36m",      // Cyan
    
    ArtistRepo: "\u001b[33m",       // Yellow
    PlaylistRepo: "\u001b[94m",     // Bright Blue
    SongRepo: "\u001b[95m",         // Bright Magenta
    JobRepo: "\u001b[91m",          // Bright Red
    
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

        // Repository Level (more specific)
        if (service.includes("ArtistRepository")) color = COLORS.ArtistRepo;
        else if (service.includes("PlaylistRepository")) color = COLORS.PlaylistRepo;
        else if (service.includes("SongRepository")) color = COLORS.SongRepo;
        else if (service.includes("JobRepository")) color = COLORS.JobRepo;
        
        // Service Level
        else if (service.includes("ArtistService")) color = COLORS.ArtistService;
        else if (service.includes("PlaylistService")) color = COLORS.PlaylistService;
        else if (service.includes("SongService")) color = COLORS.SongService;
        else if (service.includes("MiscService")) color = COLORS.MiscService;
        
        // Generic Fallbacks
        else if (service.includes("Artist")) color = COLORS.ArtistService;
        else if (service.includes("Playlist")) color = COLORS.PlaylistService;
        else if (service.includes("Song")) color = COLORS.SongService;
        else if (service.includes("Misc")) color = COLORS.MiscService;

        const label = `${COLORS.Bright}${color}[${service}]${COLORS.Reset}`;
        const trace = log.traceId ? ` ${COLORS.Infra}(${log.traceId})${COLORS.Reset}` : "";
        return `${label}${trace} ${log[messageKey]}`;
    },
});

export const PinoLogger = pino({
    level: process.env.LOG_LEVEL || "info",
}, stream);

