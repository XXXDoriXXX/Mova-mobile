import type { ExpoConfig, ConfigContext } from "expo/config";

const DEFAULT_API_URL = "http://localhost:3000/v1";
const DEFAULT_WS_URL = "ws://localhost:3002";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mova",
  slug: "mova",
  scheme: "mova",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/images/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.mova.client",
  },
  android: {
    package: "app.mova.client",
    adaptiveIcon: {
      backgroundColor: "#0E1116",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    // Native incoming-call (react-native-callkeep, self-managed) plus a
    // full-screen heads-up call notification that wakes the device from a
    // locked/killed state. The ConnectionService and its signature permission
    // ship in callkeep's own manifest and merge at prebuild; these are the
    // runtime permissions the app itself must declare.
    permissions: [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_PHONE_CALL",
      "android.permission.USE_FULL_SCREEN_INTENT",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.WAKE_LOCK",
      "android.permission.MANAGE_OWN_CALLS",
      "android.permission.READ_PHONE_STATE",
      "android.permission.READ_PHONE_NUMBERS",
      "android.permission.RECORD_AUDIO",
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-localization",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#0E1116",
        // Background data-only call pushes (type:"incoming_call") must wake the
        // JS background task on Android even when the app is killed, so callkeep
        // can present the native incoming-call UI.
        enableBackgroundRemoteNotifications: true,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // callkeep's ConnectionService + foreground service need API 24+.
          minSdkVersion: 24,
        },
      },
    ],
    // Injects callkeep's Telecom VoiceConnectionService into the manifest
    // (the library ships no config plugin and omits it from its own manifest).
    "./plugins/withCallkeepAndroid",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0E1116",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // EAS injects this during a build; we also surface it from env so
    // getExpoPushTokenAsync({ projectId }) can resolve it in any build profile.
    // Without it, push-token registration throws in standalone/EAS builds.
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? DEFAULT_WS_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
    googleOAuthAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID,
    googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
  },
});
