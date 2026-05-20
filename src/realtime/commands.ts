// Single source of truth is `./protocol.ts`, mirrored from
// `libs/shared-realtime/src/lib/ws-events.ts` on the backend.
export {
  ClientCommand,
  ClientCommandSchema,
  parseClientCommand,
} from "./protocol";
export type { ClientCommandType } from "./protocol";
