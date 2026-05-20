import { io, type Socket } from "socket.io-client";

import { WS_URL } from "@/constants/env";

import type { ClientCommand } from "./commands";
import type { ServerEvent } from "./events";

export type CallSocketOptions = {
  token: string;
  conversationId: string;
  lastStreamId?: string;
};

export type CallSocket = Socket & {
  // Strongly-typed send helper for client → server commands.
  sendCommand: (command: ClientCommand) => void;
};

export function createCallSocket(opts: CallSocketOptions): CallSocket {
  const socket = io(`${WS_URL}/calls`, {
    transports: ["websocket"],
    auth: {
      token: opts.token,
      conversationId: opts.conversationId,
      lastStreamId: opts.lastStreamId,
    },
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
    reconnectionAttempts: Infinity,
    timeout: 10_000,
  }) as Socket;

  const callSocket = socket as CallSocket;
  callSocket.sendCommand = (command: ClientCommand) => {
    callSocket.emit("command", command);
  };
  return callSocket;
}

export function onServerEvent(
  socket: CallSocket,
  handler: (event: ServerEvent) => void,
): () => void {
  const wrapped = (event: ServerEvent) => handler(event);
  socket.on("event", wrapped);
  return () => {
    socket.off("event", wrapped);
  };
}
