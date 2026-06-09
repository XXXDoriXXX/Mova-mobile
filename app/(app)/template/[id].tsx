import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getTemplate } from "@/api/templates";
import { TemplateForm, useTemplateActions } from "@/features/templates";

export default function TemplateEditScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";

  const query = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplate(id as string),
    enabled: !isNew,
  });

  const actions = useTemplateActions({ templateId: isNew ? null : (id as string) });

  if (!isNew && query.isLoading) {
    return (
      <KeyboardScreen>
        <Spinner />
      </KeyboardScreen>
    );
  }

  const data = query.data;
  const readOnly = data?.isSystem === true;

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
          {t("templates.title")}
        </Text>
        <Text variant="title">
          {isNew ? t("templates.newCta") : (data?.name ?? "")}
        </Text>
      </View>

      {readOnly && data ? (
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.lg,
              gap: 8,
            }}
          >
            <Text
              variant="label"
              color="textMuted"
              style={{ textTransform: "uppercase" }}
            >
              {t("templates.form.description")}
            </Text>
            <Text variant="body">{data.description}</Text>
          </View>
          <Button
            label={t("templates.form.duplicateCta")}
            variant="primary"
            size="md"
            fullWidth={false}
            loading={actions.busy === "duplicate"}
            onPress={actions.duplicate}
          />
        </View>
      ) : (
        <TemplateForm initial={data} onSubmit={actions.save} />
      )}

      {!isNew && !readOnly && data ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: theme.spacing.md,
          }}
        >
          <Chip
            label={
              data.isDefault
                ? t("templates.badgeDefault")
                : t("templates.form.setDefaultCta")
            }
            leading={
              <Ionicons
                name={data.isDefault ? "star" : "star-outline"}
                size={14}
                color={theme.colors.text}
              />
            }
            selected={data.isDefault}
            disabled={data.isDefault || actions.busy === "default"}
            onPress={actions.setAsDefault}
          />
          <Chip
            label={t("common.delete")}
            leading={
              <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
            }
            disabled={actions.busy === "delete"}
            onPress={actions.remove}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
