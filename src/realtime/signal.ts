import { io, type Socket } from "socket.io-client";

import { WS_URL } from "@/constants/env";
import { addBreadcrumb } from "@/observability/sentry";

import { parseSignalEvent, type SignalEvent } from "./signalProtocol";

export type SignalSocketOptions = {
  token: string;
};

export function createSignalSocket(opts: SignalSocketOptions): Socket {
  return io(`${WS_URL}/signal`, {
    transports: ["websocket"],
    auth: { token: opts.token },
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
    reconnectionAttempts: Infinity,
    timeout: 10_000,
  });
}

export function onSignalEvent(
  socket: Socket,
  handler: (event: SignalEvent) => void,
): () => void {
  const wrapped = (raw: unknown) => {
    const event = parseSignalEvent(raw);
    if (!event) {
      addBreadcrumb({
        category: "ws",
        message: "Dropped invalid signal event",
        data: { raw },
        level: "warning",
      });
      return;
    }
    handler(event);
  };
  socket.on("signal", wrapped);
  return () => {
    socket.off("signal", wrapped);
  };
}
