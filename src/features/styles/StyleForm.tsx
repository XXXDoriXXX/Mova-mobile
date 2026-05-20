import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import type { ConversationStyle } from "@/types/api";

import { styleFormSchema, type StyleFormValues } from "./schemas";

type Initial = Extract<ConversationStyle, { kind: "custom" }>;

type Props = {
  initial?: Initial;
  onSubmit: (values: StyleFormValues) => Promise<void>;
};

export function StyleForm({ initial, onSubmit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      instructions: initial?.instructions ?? "",
    },
  });

  async function handle(values: StyleFormValues) {
    setSubmitting(true);
    setBanner(null);
    try {
      await onSubmit(values);
    } catch {
      setBanner(t("auth.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {banner ? (
        <Text color="danger">{banner}</Text>
      ) : null}
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
        onPress={handleSubmit(handle)}
      />
    </View>
  );
}
