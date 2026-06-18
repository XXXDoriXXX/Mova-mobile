const { withMainApplication } = require("expo/config-plugins");

// RN 0.81 New Architecture (bridgeless) leaves the legacy-native-module interop
// OFF by default (ReactNativeFeatureFlags.useTurboModuleInterop() == false), so
// react-native-webrtc's classic `WebRTCModule` never lands in NativeModules /
// the TurboModule registry. The library then throws "WebRTC native module not
// found" at import → "Cannot read property 'prototype' of undefined" inside
// livekit-client → peer (device↔device) calls crash on start.
//
// Flip the flag on in MainApplication.onCreate() before the React host is built.
// android/ is managed by Expo prebuild, so this must be a config plugin.
const IMPORT_ANCHOR =
  "import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint";
const IMPORTS =
  IMPORT_ANCHOR +
  "\nimport com.facebook.react.internal.featureflags.ReactNativeFeatureFlags" +
  "\nimport com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults";

const OVERRIDE = `super.onCreate()
    // Expose legacy native modules (react-native-webrtc) under bridgeless.
    try {
      ReactNativeFeatureFlags.override(object : ReactNativeFeatureFlagsDefaults() {
        override fun useTurboModuleInterop(): Boolean = true
      })
    } catch (_: Throwable) {}`;

const withTurboModuleInterop = (config) =>
  withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes("ReactNativeFeatureFlags")) {
      src = src.replace(IMPORT_ANCHOR, IMPORTS);
    }
    if (!src.includes("useTurboModuleInterop")) {
      src = src.replace("super.onCreate()", OVERRIDE);
    }
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = withTurboModuleInterop;
