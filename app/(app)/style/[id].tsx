import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listStyles } from "@/api/styles";
import { StyleForm, useStyleActions } from "@/features/styles";

export default function StyleEditScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: !isNew,
  });

  const initial = !isNew
    ? stylesQuery.data?.custom.find((s) => s.id === id)
    : undefined;

  const actions = useStyleActions({ styleId: isNew ? null : (id as string) });

  if (!isNew && stylesQuery.isLoading) {
    return (
      <KeyboardScreen>
        <Spinner />
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton onPress={() => router.back()} accessibilityLabel={t("common.back")}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </IconButton>
      </View>

      <View style={{ gap: 4 }}>
        <Text variant="label" color="textMuted">
          {t("styles.title")}
        </Text>
        <Text variant="title">
          {isNew ? t("styles.newCta") : (initial?.name ?? "")}
        </Text>
      </View>

      <StyleForm
        initial={initial}
        submitting={actions.submitting}
        onSubmit={actions.save}
      />

      {!isNew && initial ? (
        <View style={{ flexDirection: "row", marginTop: theme.spacing.md }}>
          <Chip
            label={t("common.delete")}
            leading={
              <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
            }
            disabled={actions.deleting}
            onPress={actions.remove}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
