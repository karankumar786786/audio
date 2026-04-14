import { AsyncLocalStorage } from "async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage<{ traceId: string }>();

export function getTraceId() {
  return asyncLocalStorage.getStore()?.traceId;
}
