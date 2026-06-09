import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useUnsavedChanges } from "@/feedback/useUnsavedChanges";
import { useTheme } from "@/theme/ThemeProvider";
import type { ConversationStyle } from "@/types/api";

import { styleFormSchema, type StyleFormValues } from "./schemas";

type Initial = Extract<ConversationStyle, { kind: "custom" }>;

type Props = {
  initial?: Initial;
  submitting?: boolean;
  onSubmit: (values: StyleFormValues) => Promise<void>;
};

export function StyleForm({ initial, submitting = false, onSubmit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      instructions: initial?.instructions ?? "",
    },
  });

  useUnsavedChanges({
    dirty: isDirty && !submitting,
    title: t("common.discardChangesTitle"),
    body: t("common.discardChangesBody"),
    confirmLabel: t("common.discard"),
  });

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("styles.form.nameLabel")}
            placeholder={t("styles.form.namePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="instructions"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("styles.form.instructionsLabel")}
            helperText={t("styles.form.instructionsHint")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={6}
            error={errors.instructions?.message}
          />
        )}
      />
      <Button
        label={
          initial
            ? t("styles.form.submitUpdate")
            : t("styles.form.submitCreate")
        }
        loading={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}
