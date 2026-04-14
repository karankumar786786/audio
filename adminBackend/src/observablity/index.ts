import { localLogger } from "./console";
import { PinoLogger } from "./pino";


export const logger = PinoLogger;

export interface Logger {
    info(message: any, ...args: any[]): void;
    warn(message: any, ...args: any[]): void;
    error(message: any, ...args: any[]): void;
    debug?(message: any, ...args: any[]): void;
}