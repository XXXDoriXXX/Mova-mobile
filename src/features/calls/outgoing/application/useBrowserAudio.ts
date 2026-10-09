import { useCallback, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { getCallMediaTransport } from "./callMediaTransport";

const notBlocked = () => false;
const noSubscription = () => () => undefined;

export function useBrowserAudio() {
  const transport = Platform.OS === "web" ? getCallMediaTransport() : null;
  const blocked = useSyncExternalStore(
    transport?.subscribeAudioBlocked ?? noSubscription,
    transport?.getAudioBlocked ?? notBlocked,
    notBlocked,
  );
  const enableAudio = useCallback(() => {
    void transport?.enableAudio?.();
  }, [transport]);
  return { blocked, enableAudio };
}
