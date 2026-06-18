import { NativeModules, TurboModuleRegistry } from "react-native";

// New Architecture (bridgeless) exposes legacy native modules — like
// react-native-webrtc's `WebRTCModule` — through the TurboModule interop
// registry, NOT the classic `NativeModules` map. So `NativeModules.WebRTCModule`
// reads back `null`, and react-native-webrtc throws "WebRTC native module not
// found" at import time (which then cascades into "Cannot read property
// 'prototype' of undefined" inside livekit-client and kills peer calls).
//
// Bridge the module across from the TurboModule registry into NativeModules
// BEFORE any LiveKit/WebRTC code evaluates. Must be imported first (see
// livekitSetup.ts).
if (NativeModules.WebRTCModule == null) {
  try {
    const mod = TurboModuleRegistry.get<object>("WebRTCModule");
    if (mod) {
      (NativeModules as Record<string, unknown>).WebRTCModule = mod;
    }
  } catch {
    // Leave it null — livekitSetup's registerGlobals try/catch degrades to
    // MEDIA_UNAVAILABLE instead of crashing the app.
  }
}
