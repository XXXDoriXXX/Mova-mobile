import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnline } from "@/net/useOnline";

/**
 * Renders a thin banner when the device is offline. Lives at app root so
 * every screen surfaces the state without each screen wiring its own check.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { online } = useOnline();
  if (online) return null;
  return (
    <View
      style={{
        backgroundColor: theme.colors.warning,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
      }}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text variant="caption" style={{ color: theme.colors.primaryText }}>
        {t("common.offlineBanner")}
      </Text>
    </View>
  );
}
