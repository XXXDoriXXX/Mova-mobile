import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { ConversationsList } from "@/features/conversations/ConversationsList";
import type { ConversationStatus } from "@/types/api";

type Filter = "all" | ConversationStatus;

const FILTERS: { key: Filter; i18nKey: string }[] = [
  { key: "all", i18nKey: "history.filterAll" },
  { key: "ended", i18nKey: "history.filterEnded" },
  { key: "active", i18nKey: "history.filterActive" },
  { key: "failed", i18nKey: "history.filterFailed" },
];

/**
 * History tab. Filter chips at the top scroll horizontally so we never
 * wrap into a second row that pushes the list down on narrow devices;
 * the list itself paginates infinitely and exposes long-press to delete.
 */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <Screen>
      <View style={{ flex: 1, gap: theme.spacing.md, paddingTop: 4 }}>
        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("history.title")}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(f.i18nKey)}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        <View style={{ flex: 1 }}>
          <ConversationsList
            status={filter === "all" ? undefined : filter}
            onOpen={(id) => router.push(`/conversation/${id}`)}
          />
        </View>
      </View>
    </Screen>
  );
}
