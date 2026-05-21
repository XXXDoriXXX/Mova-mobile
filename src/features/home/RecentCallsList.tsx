import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { formatPhoneForDisplay } from "@/utils/phone";

type Props = {
  items: Conversation[];
};

const STATUS_ICON: Record<Conversation["status"], keyof typeof Ionicons.glyphMap> = {
  pending: "ellipse-outline",
  active: "radio",
  ended: "checkmark-circle",
  failed: "alert-circle",
};

/**
 * Recent-calls list shown on the home screen and the history tab.
 *
 * Each row is a tappable card with the contact identity on the left and a
 * round dial-back affordance on the right. Status is conveyed by a small
 * icon, not by colour alone (helps with colour-blindness).
 */
export function RecentCallsList({ items }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <EmptyState
        icon="call-outline"
        title={t("home.recentEmpty")}
        body={t("home.recentEmptyBody")}
        ctaLabel={t("home.startCallCta")}
        onCta={() => router.push("/call/pre")}
      />
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {items.map((c, i) => (
        <Animated.View
          key={c.id}
          entering={FadeInDown.duration(280).delay(Math.min(i * 60, 240))}
        >
          <RecentRow
            item={c}
            onOpen={() =>
              router.push({
                pathname: "/conversation/[id]",
                params: { id: c.id },
              })
            }
            onRecall={() =>
              router.push({
                pathname: "/call/pre",
                params: { prefillPhone: c.targetPhone },
              })
            }
          />
        </Animated.View>
      ))}
    </View>
  );
}

type RowProps = {
  item: Conversation;
  onOpen: () => void;
  onRecall: () => void;
};

function RecentRow({ item, onOpen, onRecall }: RowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const phone = formatPhoneForDisplay(item.targetPhone);
  const statusColor =
    item.status === "failed"
      ? theme.colors.danger
      : item.status === "active"
        ? theme.colors.success
        : theme.colors.textMuted;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar name={phone} size={42} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyLarge" weight="bold">
          {phone}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={STATUS_ICON[item.status]} size={12} color={statusColor} />
          <Text variant="caption" color="textMuted">
            {formatRelativeFromNow(item.startedAt)}
            {item.durationSeconds > 0
              ? ` · ${formatDuration(item.durationSeconds)}`
              : ""}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("history.recall")}
        onPress={onRecall}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Ionicons name="call" size={16} color={theme.colors.primaryText} />
      </Pressable>
    </Pressable>
  );
}
