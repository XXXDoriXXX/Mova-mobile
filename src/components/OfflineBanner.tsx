import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnline } from "@/net/useOnline";
import { toast } from "@/feedback/toastStore";

/**
 * Persistent banner at the very top of every screen while the device is
 * offline. Also surfaces a one-off "connection restored" toast when the
 * device comes back online — that toast is the only transient feedback
 * we need; the banner already covers the persistent state.
 *
 * `wasOffline` tracks whether the user actually saw the offline banner
 * during this session, so we don't show "restored" the first time the
 * app boots online (which would be confusing).
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { online } = useOnline();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success(t("common.onlineRestored"));
    }
  }, [online, t]);

  if (online) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      style={{
        backgroundColor: theme.colors.warning,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
      }}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View>
        <Text variant="caption" weight="bold" style={{ color: theme.colors.primaryText }}>
          {t("common.offlineBanner")}
        </Text>
      </View>
    </Animated.View>
  );
}
