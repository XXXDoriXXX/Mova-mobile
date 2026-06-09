import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useCallStore } from "../callStore";

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
