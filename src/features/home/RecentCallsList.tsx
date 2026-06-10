import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { conversationTitle } from "@/utils/conversation-display";

import { selectRecentCallStatus, type RecentCallTone } from "./application/selectRecentCallStatus";

type Props = {
  items: Conversation[];
  onOpen: (conversationId: string) => void;
  onRecall: (targetPhone: string) => void;
  onEmptyCta: () => void;
};

export function RecentCallsList({ items, onOpen, onRecall, onEmptyCta }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <EmptyState
        icon="call-outline"
        title={t("home.recentEmpty")}
        body={t("home.recentEmptyBody")}
        ctaLabel={t("home.startCallCta")}
        onCta={onEmptyCta}
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
            onOpen={() => onOpen(c.id)}
            onRecall={
              c.targetPhone ? () => onRecall(c.targetPhone as string) : null
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
  onRecall: (() => void) | null;
};

function RecentRow({ item, onOpen, onRecall }: RowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const phone = conversationTitle(item);
  const { iconName, tone } = selectRecentCallStatus(item.status);
  const iconColor = toneToColor(tone, theme);

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
          <Ionicons name={iconName} size={12} color={iconColor} />
          <Text variant="caption" color="textMuted">
            {formatRelativeFromNow(item.startedAt)}
            {item.durationSeconds > 0
              ? ` · ${formatDuration(item.durationSeconds)}`
              : ""}
          </Text>
        </View>
      </View>
      {onRecall ? (
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
      ) : null}
    </Pressable>
  );
}

function toneToColor(tone: RecentCallTone, theme: ReturnType<typeof useTheme>): string {
  switch (tone) {
    case "danger":
      return theme.colors.danger;
    case "success":
      return theme.colors.success;
    case "muted":
      return theme.colors.textMuted;
  }
}
