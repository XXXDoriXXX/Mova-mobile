import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listTemplates } from "@/api/templates";
import { TemplatesList } from "@/features/templates/TemplatesList";

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
      <View style={{ gap: theme.spacing.lg }}>
        <Text variant="title">{t("templates.title")}</Text>

        <Button
          label={t("templates.newCta")}
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
      </View>
    </Screen>
  );
}
