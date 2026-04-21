import { inngest } from "../infra";

export const heartbeat = inngest.createFunction(
  { id: "heartbeat", triggers: [{ event: "admin/heartbeat" }] as any },
  async ({ event, step }: any) => {
    return { status: "alive", timestamp: new Date().toISOString() };
  }
);

export const functions = [heartbeat];
