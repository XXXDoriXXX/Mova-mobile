import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { signInWithGoogle } from "@/api/auth";
import { useAuthStore } from "@/auth/store";

WebBrowser.maybeCompleteAuthSession();

type Extra = {
  googleOAuthWebClientId?: string;
  googleOAuthAndroidClientId?: string;
  googleOAuthIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

type Props = {
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: extra.googleOAuthWebClientId,
    androidClientId: extra.googleOAuthAndroidClientId,
    iosClientId: extra.googleOAuthIosClientId,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type !== "success") {
      if (response.type === "error") {
        onError?.(response.error?.message ?? "Google sign-in failed");
      }
      setBusy(false);
      return;
    }
    const idToken = response.params.id_token;
    if (!idToken) {
      onError?.("Google response missing id_token");
      setBusy(false);
      return;
    }
    void (async () => {
      try {
        const resp = await signInWithGoogle(idToken);
        await setSession({ user: resp.user, tokens: resp.tokens });
      } catch (err) {
        onError?.(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    })();
  }, [response, onError, setSession]);

  const disabled = !request || busy;

  async function handlePress() {
    if (!request) return;
    setBusy(true);
    try {
      await promptAsync();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t("auth.googleSignIn")}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: theme.radii.pill,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="logo-google" size={20} color={theme.colors.text} />
      </View>
      <Text variant="button" color="text">
        {busy ? t("auth.googleSigningIn") : t("auth.googleSignIn")}
      </Text>
    </Pressable>
  );
}
