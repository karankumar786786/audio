import { PinoLogger } from "./pino";
import { getTraceId } from "./trace";
import type { Logger } from "./index";
import type { Logger as PinoLoggerType } from "pino";

export class AppLogger implements Logger {
    constructor(private readonly baseLogger: PinoLoggerType = PinoLogger as any) {}

    private enrich(message: any) {
        const traceId = getTraceId();
        if (typeof message === "object" && message !== null) {
            return { traceId, ...message };
        }
        return { traceId, msg: message };
    }
    info(message: any, ...args: any[]) {
        this.baseLogger.info(this.enrich(message), ...args);
    }

    warn(message: any, ...args: any[]) {
        this.baseLogger.warn(this.enrich(message), ...args);
    }

    error(message: any, ...args: any[]) {
        this.baseLogger.error(this.enrich(message), ...args);
    }

    debug(message: any, ...args: any[]) {
        this.baseLogger.debug(this.enrich(message), ...args);
    }

    child(bindings: any): Logger {
        return new AppLogger(this.baseLogger.child(bindings));
    }
}
