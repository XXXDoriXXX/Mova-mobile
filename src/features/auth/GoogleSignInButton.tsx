import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import { isGoogleSignInConfigured } from "./application/googleAuthConfig";
import { useGoogleSignInUseCase } from "./application/useGoogleSignInUseCase";

type Props = {
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onError }: Props) {
  if (!isGoogleSignInConfigured()) return null;
  return <GoogleSignInButtonInner onError={onError} />;
}

function GoogleSignInButtonInner({ onError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { ready, busy, error, start } = useGoogleSignInUseCase();

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const disabled = !ready || busy;

  return (
    <Pressable
      onPress={() => void start()}
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
