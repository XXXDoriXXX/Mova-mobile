import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "@/api/templates";
import { TemplateForm } from "@/features/templates/TemplateForm";
import type { TemplateFormValues } from "@/features/templates/schemas";

/**
 * Template editor — create / edit / duplicate / delete. System templates
 * are read-only; the only action exposed for them is "Duplicate" which
 * lands the user on the editable copy. Mutations invalidate the index
 * cache so the templates screen reflects the change on back.
 */
export default function TemplateEditScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";

  const query = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplate(id as string),
    enabled: !isNew,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["templates"] });

  const createMut = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; values: TemplateFormValues }) =>
      updateTemplate(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const [busy, setBusy] = useState<"duplicate" | "default" | "delete" | null>(
    null,
  );

  async function onSubmit(values: TemplateFormValues) {
    if (isNew) {
      await createMut.mutateAsync(values);
    } else {
      await updateMut.mutateAsync({ id: id as string, values });
    }
  }

  async function onDuplicate() {
    if (!query.data) return;
    setBusy("duplicate");
    try {
      const dup = await duplicateTemplate(query.data.id);
      invalidate();
      router.replace(`/template/${dup.id}`);
    } finally {
      setBusy(null);
    }
  }

  async function onSetDefault() {
    if (!query.data) return;
    setBusy("default");
    try {
      await setDefaultTemplate(query.data.id);
      invalidate();
    } finally {
      setBusy(null);
    }
  }

  function onDelete() {
    if (!query.data) return;
    Alert.alert(t("templates.form.deleteConfirm"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setBusy("delete");
          try {
            await deleteTemplate(query.data!.id);
            invalidate();
            router.back();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }

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

      {readOnly ? (
        <Button
          label={t("templates.form.duplicateCta")}
          variant="primary"
          loading={busy === "duplicate"}
          onPress={onDuplicate}
        />
      ) : (
        <TemplateForm initial={data} onSubmit={onSubmit} />
      )}

      {!isNew && !readOnly && data ? (
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          <Button
            label={t("templates.form.setDefaultCta")}
            variant="secondary"
            loading={busy === "default"}
            onPress={onSetDefault}
            disabled={data.isDefault}
          />
          <Button
            label={t("common.delete")}
            variant="ghost"
            loading={busy === "delete"}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
