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

/**
 * Sticky, in-context status banner for the live-call screen. Replaces
 * the ephemeral 4-second auto-clearing toast — provider degradation
 * happens fast (a couple of seconds of glitch) but the user reads
 * the chat at their own pace; a 4s window meant the message was gone
 * before they looked up from the partner's last bubble.
 *
 * Two states it surfaces, in priority order:
 *
 *   1. **Reconnecting** — WS dropped, mid-reconnect. Wins over error
 *      banners because if the wire is down nothing else matters; the
 *      icon pulses so the user reads it as "active recovery" not
 *      "permanently broken". We don't ship a dismiss for this one —
 *      it auto-clears the moment status flips back to `active`.
 *
 *   2. **Recoverable error** — provider degradation, rate limit, etc.
 *      Stays on screen until the user dismisses (X) OR a new error
 *      replaces it. Some codes (RATE_LIMITED, moderation) intentionally
 *      lock the X out so the user can't miss the reason a message
 *      didn't go through.
 *
 * Copy is hidden behind `errorCopy.ts` so the backend's server-y
 * messages (e.g. "stt provider degraded — switching to fallback")
 * never reach the user. UA-first translations live in i18n bundles.
 */
export function CallStatusBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const status = useCallStore((s) => s.status);
  const toastError = useCallStore((s) => s.toastError);
  const setToastError = useCallStore((s) => s.setToastError);

  // Reconnecting is the override layer — replaces any error banner
  // for the duration. The error stays in store and pops back in if
  // it's still relevant once we're connected again.
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
  // Sync the spin animation here so reconnecting's icon visually
  // communicates "active retry" instead of just sitting static.
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

  // Tone → palette. We pick from theme tokens so dark-mode polish later
  // doesn't need to touch this file.
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
