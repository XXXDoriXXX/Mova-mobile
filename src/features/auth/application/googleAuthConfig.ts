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

/**
 * Whether Google sign-in can run on the current platform. `expo-auth-session`
 * throws synchronously if the platform's client id is missing, so callers must
 * gate the auth-request hook behind this check (don't render the button at
 * all when it returns false) rather than catching after the fact.
 */
export function isGoogleSignInConfigured(): boolean {
  if (Platform.OS === "android") return Boolean(googleClientIds.android);
  if (Platform.OS === "ios") return Boolean(googleClientIds.ios);
  if (Platform.OS === "web") return Boolean(googleClientIds.web);
  return false;
}
