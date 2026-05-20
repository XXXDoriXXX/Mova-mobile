// Single source of truth is `./protocol.ts`, mirrored from
// `libs/shared-realtime/src/lib/ws-events.ts` on the backend.
export {
  ServerEvent,
  ServerEventSchema,
  parseServerEvent,
} from "./protocol";
export type { ServerEventType } from "./protocol";
export type { ServerEvent as ServerEventValue } from "./protocol";
