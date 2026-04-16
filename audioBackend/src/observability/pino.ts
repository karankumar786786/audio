import pino from "pino";
import pretty from "pino-pretty";
import {config} from "dotenv"
config();
// ANSI colors for professional service identification
const COLORS = {
    Artist: "\u001b[32m",      // Green
    Playlist: "\u001b[34m",    // Blue
    Song: "\u001b[35m",        // Magenta
    User: "\u001b[33m",        // Yellow
    Interaction: "\u001b[36m", // Cyan
    Search: "\u001b[96m",      // Bright Cyan
    Job: "\u001b[91m",         // Bright Red
    Misc: "\u001b[90m",        // Gray
    System: "\u001b[37m",      // White
    
    Reset: "\u001b[0m",
    Bright: "\u001b[1m",
    Dim: "\u001b[2m",
};

const stream = pretty({
    colorize: true,
    translateTime: "yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname,service",
    messageFormat: (log: any, messageKey: string) => {
        const service = (log.service as string) || "System";
        let color = COLORS.System;

        // Greedy matching for domains
        if (service.includes("Artist")) color = COLORS.Artist;
        else if (service.includes("Playlist")) color = COLORS.Playlist;
        else if (service.includes("Song")) color = COLORS.Song;
        else if (service.includes("User")) color = COLORS.User;
        else if (service.includes("Interaction")) color = COLORS.Interaction;
        else if (service.includes("Search")) color = COLORS.Search;
        else if (service.includes("Job")) color = COLORS.Job;
        else if (service.includes("Misc")) color = COLORS.Misc;

        const label = `${COLORS.Bright}${color}[${service}]${COLORS.Reset}`;
        const trace = log.traceId ? ` ${COLORS.Dim}(${log.traceId})${COLORS.Reset}` : "";
        return `${label}${trace} ${log[messageKey]}`;
    },
});

export const PinoLogger = pino({
    level:"debug",
}, stream);
