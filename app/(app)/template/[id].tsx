import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
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
      toast.success(t("templates.form.created"));
      router.back();
    },
    onError: () => toast.error(t("templates.form.saveError")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; values: TemplateFormValues }) =>
      updateTemplate(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      toast.success(t("templates.form.updated"));
      router.back();
    },
    onError: () => toast.error(t("templates.form.saveError")),
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
      toast.success(t("templates.form.duplicated"));
      router.replace(`/template/${dup.id}`);
    } catch {
      toast.error(t("templates.form.saveError"));
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
      toast.success(t("templates.form.defaultSet"));
    } catch {
      toast.error(t("templates.form.saveError"));
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!query.data) return;
    const ok = await confirm({
      title: t("templates.form.deleteConfirm"),
      confirmLabel: t("common.delete"),
      destructive: true,
      icon: "trash-outline",
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await deleteTemplate(query.data.id);
      invalidate();
      toast.success(t("templates.form.deleted"));
      router.back();
    } finally {
      setBusy(null);
    }
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

      {readOnly && data ? (
        // System templates can't be edited — show a read-only preview
        // + a smaller "Duplicate" affordance. Without the preview the
        // page would be a single huge button with nothing else.
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
            loading={busy === "duplicate"}
            onPress={onDuplicate}
          />
        </View>
      ) : (
        <TemplateForm initial={data} onSubmit={onSubmit} />
      )}

      {/* Secondary actions live in a chip row below the form so they
          don't compete with the form's primary submit button. Delete is
          last + red text — destructive but quiet. */}
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
            disabled={data.isDefault || busy === "default"}
            onPress={onSetDefault}
          />
          <Chip
            label={t("common.delete")}
            leading={
              <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
            }
            disabled={busy === "delete"}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
