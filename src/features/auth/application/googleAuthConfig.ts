import { Platform } from "react-native";
import Constants from "expo-constants";

type GoogleExtra = {
  googleOAuthWebClientId?: string;
  googleOAuthAndroidClientId?: string;
  googleOAuthIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

export const googleClientIds = {
  web: extra.googleOAuthWebClientId,
  android: extra.googleOAuthAndroidClientId,
  ios: extra.googleOAuthIosClientId,
};

export function isGoogleSignInConfigured(): boolean {
  if (Platform.OS === "android") return Boolean(googleClientIds.android);
  if (Platform.OS === "ios") return Boolean(googleClientIds.ios);
  if (Platform.OS === "web") return Boolean(googleClientIds.web);
  return false;
}
