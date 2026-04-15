import { PinoLogger } from "./pino";
import { getTraceId } from "./trace";
import type { Logger } from "./index";
import type { Logger as PinoLoggerType } from "pino";

export class AppLogger implements Logger {
    constructor(private readonly baseLogger: PinoLoggerType = PinoLogger as unknown as PinoLoggerType) {}
    private enrich(message: unknown) {
        const traceId = getTraceId();
        if (typeof message === "object" && message !== null) {
            return { traceId, ...(message as object) };
        }
        return { traceId, msg: message };
    }
    info(message: unknown, ...args: any[]) {
        this.baseLogger.info(this.enrich(message) as object, ...args);
    }

    warn(message: unknown, ...args: any[]) {
        this.baseLogger.warn(this.enrich(message) as object, ...args);
    }

    error(message: unknown, ...args: any[]) {
        this.baseLogger.error(this.enrich(message) as object, ...args);
    }

    debug(message: unknown, ...args: any[]) {
        this.baseLogger.debug(this.enrich(message) as object, ...args);
    }

    child(bindings: any): Logger {
        return new AppLogger(this.baseLogger.child(bindings));
    }
}
