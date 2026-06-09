import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useUnsavedChanges } from "@/feedback/useUnsavedChanges";
import { useTheme } from "@/theme/ThemeProvider";
import type { Template } from "@/types/api";

import { mapTemplateFormError } from "./application/mapTemplateFormError";
import { templateFormSchema, type TemplateFormValues } from "./schemas";

type Props = {
  initial?: Template;
  onSubmit: (values: TemplateFormValues) => Promise<{ ok: boolean; error?: unknown }>;
};

export function TemplateForm({ initial, onSubmit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      systemPrompt: initial?.systemPrompt ?? "",
      language: initial?.language ?? "uk",
    },
  });

  useUnsavedChanges({
    dirty: isDirty && !submitting,
    title: t("common.discardChangesTitle"),
    body: t("common.discardChangesBody"),
    confirmLabel: t("common.discard"),
  });

  const language = watch("language");

  async function handle(values: TemplateFormValues) {
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await onSubmit(values);
      if (result.ok || !result.error) return;
      const mapped = mapTemplateFormError(result.error);
      if (mapped.kind === "field" && mapped.code === "promptInjection") {
        setError("systemPrompt", { message: t("templates.form.errorPromptInjection") });
      } else {
        setBanner(t("auth.errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {banner ? (
        <Text color="danger" variant="body">
          {banner}
        </Text>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("templates.form.title")}
            placeholder={t("templates.form.titlePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("templates.form.description")}
            placeholder={t("templates.form.descriptionPlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={3}
            error={errors.description?.message}
          />
        )}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label">{t("templates.form.language")}</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Chip
            label={t("auth.languageUk")}
            selected={language === "uk"}
            onPress={() => setValue("language", "uk", { shouldDirty: true })}
          />
          <Chip
            label={t("auth.languageEn")}
            selected={language === "en"}
            onPress={() => setValue("language", "en", { shouldDirty: true })}
          />
        </View>
      </View>

      <Button
        label={t("templates.form.advanced")}
        variant="ghost"
        size="md"
        onPress={() => setAdvancedOpen((v) => !v)}
      />

      {advancedOpen ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="caption" color="textMuted">
            {t("templates.form.systemPromptHint")}
          </Text>
          <Controller
            control={control}
            name="systemPrompt"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t("templates.form.systemPromptLabel")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={8}
                error={errors.systemPrompt?.message}
              />
            )}
          />
        </View>
      ) : null}

      <Button
        label={initial ? t("templates.form.submitUpdate") : t("templates.form.submitCreate")}
        loading={submitting}
        onPress={handleSubmit(handle)}
      />
    </View>
  );
}
