import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useCallStore } from "./callStore";

/**
 * Reflects OS app-state changes into the call store. We do NOT proactively
 * disconnect the WS on background — socket.io's reconnect logic is robust and
 * a short background trip should usually survive. We DO surface the
 * uncertainty in the UI (status="reconnecting") so the user understands why
 * messages may pause. On foreground, the socket will be reconnected by its
 * own reconnect manager; if it had already died, this triggers a re-attempt.
 */
export function useAppStateReconnect(): void {
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = lastStateRef.current;
      lastStateRef.current = next;
      const store = useCallStore.getState();
      if (store.status === "idle" || store.status === "ended") return;

      if (next === "background" || next === "inactive") {
        if (store.status === "active") store.setStatus("reconnecting");
        return;
      }
      if (next === "active" && prev !== "active") {
        // Reconnection probe lives on the next ping from useCallSocket; here
        // we just nudge the UI back to active if the socket actually still
        // works — the next pong (or any event) will flip it back to active
        // anyway. Setting the status here would be premature.
      }
    });
    return () => sub.remove();
  }, []);
}
