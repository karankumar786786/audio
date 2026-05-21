export interface Logger {
  info(message: unknown, ...args: any[]): void;
  warn(message: unknown, ...args: any[]): void;
  error(message: unknown, ...args: any[]): void;
  debug(message: unknown, ...args: any[]): void;
  child(bindings: any): Logger;
}

export function logMethods(instance: any, logger: Logger) {
  if (!logger || typeof logger.info !== "function") return;
  const proto = Object.getPrototypeOf(instance);
  if (!proto) return;
  const methods = Object.getOwnPropertyNames(proto)
    .filter(name => name !== "constructor" && typeof instance[name] === "function");
  methods.forEach(method => {
    logger.info(`${method} method is available`);
  });
}
