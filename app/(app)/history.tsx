import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { ConversationsList } from "@/features/conversations/ConversationsList";

export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, flex: 1 }}>
        <Text variant="title">{t("history.title")}</Text>
        <ConversationsList
          onOpen={(id) => router.push(`/conversation/${id}`)}
        />
      </View>
    </Screen>
  );
}
