import { AppLogger } from "./logger-wrapper";

export interface Logger {
    info(message: unknown, ...args: any[]): void;
    warn(message: unknown, ...args: any[]): void;
    error(message: unknown, ...args: any[]): void;
    debug(message: unknown, ...args: any[]): void;
    child(bindings: any): Logger;
}

export const logger: Logger = new AppLogger();


export function logMethods(instance: object, logger: Logger) {
    const proto = Object.getPrototypeOf(instance);
    const methods = Object.getOwnPropertyNames(proto)
        .filter(name => name !== "constructor" && typeof (instance as any)[name] === "function");

    
    methods.forEach(method => {
        logger.info(`${method} method is available`);
    });
}