import { localLogger } from "./console";


export const logger = localLogger;

export interface Logger {
    info(message: any, ...args: any[]): void;
    warn(message: any, ...args: any[]): void;
    error(message: any, ...args: any[]): void;
    debug?(message: any, ...args: any[]): void;
}