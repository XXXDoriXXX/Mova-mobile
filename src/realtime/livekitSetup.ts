import { registerGlobals } from "@livekit/react-native";

// Register the WebRTC globals (RTCPeerConnection, MediaStream, …) ONCE at app
// startup, before livekit-client is first evaluated — calling it lazily at call
// time threw "Cannot read property 'prototype' of undefined". Wrapped so a
// missing native module degrades to MEDIA_UNAVAILABLE instead of white-screening
// the whole app (registerGlobals throwing here used to break the root layout).
try {
  registerGlobals();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(
    "[mova/livekit] registerGlobals failed — in-app call media disabled:",
    err instanceof Error ? err.message : String(err),
  );
}
