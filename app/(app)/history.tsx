import { useState } from "react";
import { View } from "react-native";
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

export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, flex: 1 }}>
        <Text variant="title">{t("history.title")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(f.i18nKey)}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>
        <ConversationsList
          status={filter === "all" ? undefined : filter}
          onOpen={(id) => router.push(`/conversation/${id}`)}
        />
      </View>
    </Screen>
  );
}
