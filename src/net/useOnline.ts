import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export type OnlineState = {
  online: boolean;
  type: NetInfoState["type"] | null;
};

/**
 * Subscribes to OS-level connectivity changes. Treats `null` (unknown) as
 * online — pessimism here causes ghost offline banners on slow boot.
 */
export function useOnline(): OnlineState {
  const [state, setState] = useState<OnlineState>({ online: true, type: null });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((ns) => {
      const reachable = ns.isInternetReachable;
      const connected = ns.isConnected;
      const online =
        reachable === null
          ? connected !== false
          : reachable && connected !== false;
      setState({ online, type: ns.type });
    });
    // Prime once on mount so first frame reflects current state.
    void NetInfo.fetch().then((ns) => {
      const reachable = ns.isInternetReachable;
      const connected = ns.isConnected;
      const online =
        reachable === null
          ? connected !== false
          : reachable && connected !== false;
      setState({ online, type: ns.type });
    });
    return () => unsubscribe();
  }, []);

  return state;
}
