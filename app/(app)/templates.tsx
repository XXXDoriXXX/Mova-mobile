import { RefreshControl, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listTemplates } from "@/api/templates";
import { TemplatesList } from "@/features/templates/TemplatesList";

/**
 * Templates index. Shows the user's templates + system presets with a
 * floating "new" CTA at the top. Pull-to-refresh; per-item navigation
 * to the editor at `/template/[id]`.
 */
export default function TemplatesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["templates"],
    queryFn: listTemplates,
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingTop: 4,
          paddingBottom: 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={theme.colors.text}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton
            onPress={() => router.back()}
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </IconButton>
          <IconButton
            tone="ink"
            onPress={() => router.push("/template/new")}
            accessibilityLabel={t("templates.newCta")}
          >
            <Ionicons name="add" size={22} color={theme.colors.primaryText} />
          </IconButton>
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("templates.title")}</Text>
        </View>

        <Button
          label={t("templates.newCta")}
          variant="accent"
          leading={<Ionicons name="add" size={16} color={theme.colors.accentText} />}
          onPress={() => router.push("/template/new")}
        />

        {query.isLoading ? (
          <Spinner />
        ) : (
          <TemplatesList
            items={query.data ?? []}
            onSelect={(tpl) => router.push(`/template/${tpl.id}`)}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
