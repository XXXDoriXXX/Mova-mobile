import { registerGlobals } from "@livekit/react-native";

// Register the WebRTC globals (RTCPeerConnection, MediaStream, MediaStreamTrack,
// …) ONCE at app startup, before livekit-client is first evaluated. Doing this
// lazily at call time was too late — livekit-client had already captured the
// (undefined) globals, so connecting threw "Cannot read property 'prototype' of
// undefined". This module must be imported first in the root layout.
registerGlobals();
