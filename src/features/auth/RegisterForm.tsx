import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { register as registerRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";

import { registerSchema, type RegisterValues } from "./schemas";
import { useAuthErrorMapper } from "./useAuthErrorMessage";

export function RegisterForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const mapError = useAuthErrorMapper();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", language: "uk" },
  });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    setBanner(null);
    try {
      const resp = await registerRequest(values);
      await setSession({
        user: resp.user,
        tokens: {
          accessToken: resp.accessToken,
          refreshToken: resp.refreshToken,
        },
      });
    } catch (err) {
      const mapped = mapError(err);
      if (mapped.emailError)
        setError("email", { message: mapped.emailError });
      if (mapped.passwordError)
        setError("password", { message: mapped.passwordError });
      if (mapped.banner) setBanner(mapped.banner);
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
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("auth.emailLabel")}
            placeholder={t("auth.emailPlaceholder")}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("auth.passwordLabel")}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t("auth.nameLabel")}
            placeholder={t("auth.namePlaceholder")}
            autoCapitalize="words"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Button
        label={t("auth.registerCta")}
        onPress={handleSubmit(onSubmit)}
        loading={submitting}
      />
    </View>
  );
}
