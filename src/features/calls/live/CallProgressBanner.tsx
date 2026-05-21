import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useCallStore } from "@/features/calls/live/callStore";
import { formatDuration } from "@/utils/format";

/**
 * Floating "call in progress" banner that surfaces when the user is
 * inside an active call but currently looking at a different screen
 * (e.g. they navigated to /history mid-conversation, or the call
 * connected in the background). Tapping it jumps back to /call/live.
 *
 * Hidden when:
 *   - There's no active call (`status` is idle / ended / failed)
 *   - The user is already on /call/live (banner would be redundant)
 *
 * Positioned above the tab bar — uses the same bottom-inset math.
 */
export function CallProgressBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const status = useCallStore((s) => s.status);
  const usageTick = useCallStore((s) => s.usageTick);

  const isActive = status === "active" || status === "reconnecting";
  const isOnLiveScreen = pathname?.startsWith("/call/live") ?? false;

  if (!isActive || isOnLiveScreen) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + 90, // sit just above the floating tab bar
        paddingHorizontal: 16,
        zIndex: 5000, // below toasts (9999), above content
      }}
    >
      <Animated.View
        entering={FadeInDown.duration(220).springify().damping(14)}
        exiting={FadeOutDown.duration(160)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("live.bannerCta")}
          onPress={() => router.push("/call/live")}
          style={{
            backgroundColor: theme.colors.accent,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: theme.colors.text,
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          {/* Pulsing dot indicates the active connection. */}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: status === "reconnecting"
                ? theme.colors.warning
                : theme.colors.danger,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="bold" color="accentText">
              {status === "reconnecting"
                ? t("live.reconnecting")
                : t("live.bannerTitle")}
            </Text>
            <Text variant="label" color="accentText" style={{ opacity: 0.7 }}>
              {formatDuration(usageTick?.secondsElapsed ?? 0)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.accentText} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
