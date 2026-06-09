import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useCallStore } from "./callStore";
import { copyForError, type ErrorBannerCopy } from "./application/errorCopy";

export function CallStatusBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const status = useCallStore((s) => s.status);
  const toastError = useCallStore((s) => s.toastError);
  const setToastError = useCallStore((s) => s.setToastError);

  if (status === "reconnecting") {
    return (
      <BannerShell
        tone="warning"
        icon="sync"
        spin
        title={t("liveStatus.reconnecting.title")}
        body={t("liveStatus.reconnecting.body")}
      />
    );
  }

  if (toastError) {
    const copy = copyForError(toastError.code, toastError.message, t);
    return (
      <ErrorBanner
        copy={copy}
        onDismiss={
          copy.dismissible ? () => setToastError(null) : undefined
        }
      />
    );
  }

  return null;
}

function ErrorBanner({
  copy,
  onDismiss,
}: {
  copy: ErrorBannerCopy;
  onDismiss?: () => void;
}) {
  return (
    <BannerShell
      tone={copy.tone}
      icon={copy.tone === "danger" ? "alert-circle" : "warning"}
      title={copy.title}
      body={copy.body}
      onDismiss={onDismiss}
    />
  );
}

function BannerShell({
  tone,
  icon,
  spin = false,
  title,
  body,
  onDismiss,
}: {
  tone: "info" | "warning" | "danger";
  icon: keyof typeof Ionicons.glyphMap;
  spin?: boolean;
  title: string;
  body: string;
  onDismiss?: () => void;
}) {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (!spin) return;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [spin, rotation]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const palette = (() => {
    if (tone === "danger") {
      return {
        bg: "rgba(229,72,61,0.10)",
        border: theme.colors.danger,
        fg: theme.colors.danger,
      };
    }
    if (tone === "info") {
      return {
        bg: theme.colors.surfaceMuted,
        border: theme.colors.border,
        fg: theme.colors.textMuted,
      };
    }
    return {
      bg: "rgba(199,119,0,0.10)",
      border: theme.colors.warning,
      fg: theme.colors.warning,
    };
  })();

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(180)}
      style={{
        marginHorizontal: theme.spacing.page,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Animated.View style={spin ? iconStyle : undefined}>
        <Ionicons name={icon} size={18} color={palette.fg} />
      </Animated.View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" weight="bold" style={{ color: palette.fg }}>
          {title}
        </Text>
        <Text variant="caption" color="text" style={{ lineHeight: 16 }}>
          {body}
        </Text>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ padding: 2 }}
        >
          <Ionicons name="close" size={16} color={palette.fg} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
