import { AppLogger } from "./logger-wrapper";

export interface Logger {
    info(message: any, ...args: any[]): void;
    warn(message: any, ...args: any[]): void;
    error(message: any, ...args: any[]): void;
    debug(message: any, ...args: any[]): void;
    child(bindings: any): Logger;
}

export const logger: Logger = new AppLogger();


export function logMethods(instance: any, logger: Logger) {
    const proto = Object.getPrototypeOf(instance);
    const methods = Object.getOwnPropertyNames(proto)
        .filter(name => name !== "constructor" && typeof instance[name] === "function");
    
    methods.forEach(method => {
        logger.info(`${method} method is available`);
    });
}