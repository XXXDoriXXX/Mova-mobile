import type { ExpoConfig, ConfigContext } from "expo/config";

const DEFAULT_API_URL = "http://localhost:3000/v1";
// realtime-service runs on :3002 (see backend docker-compose.yml). The
// earlier ":3001" default was wrong — that's the agent-worker's internal
// port, which the mobile client never talks to directly.
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
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? DEFAULT_WS_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
    googleOAuthAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID,
    googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
  },
});
