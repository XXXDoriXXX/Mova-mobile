import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./Button";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  /** Hero icon. Rendered inside a soft round badge. */
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  /** Primary action — the chip-sized CTA at the bottom. */
  ctaLabel?: string;
  onCta?: () => void;
  /** Custom slot below the body (e.g. secondary actions). */
  children?: ReactNode;
  style?: ViewStyle;
};

/**
 * Friendly empty-state card. Centred icon badge, headline, supporting
 * copy and an optional CTA. Used in place of bare "Nothing here" lines
 * so empty screens feel inviting rather than broken.
 */
export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onCta,
  children,
  style,
}: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          paddingVertical: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xxl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          gap: 10,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={26} color={theme.colors.accentText} />
      </View>
      <Text variant="subtitle" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textMuted" align="center" style={{ maxWidth: 280 }}>
          {body}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View style={{ marginTop: 6 }}>
          <Button
            label={ctaLabel}
            variant="primary"
            size="md"
            fullWidth={false}
            onPress={onCta}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
}
