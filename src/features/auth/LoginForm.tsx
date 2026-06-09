import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";

import { useLoginUseCase } from "./application/useLoginUseCase";
import { loginSchema, type LoginValues } from "./schemas";

type Props = {
  onError?: (message: string | null) => void;
};

export function LoginForm({ onError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const { submitting, execute } = useLoginUseCase();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    onError?.(null);
    const result = await execute(values);
    if (result.ok) return;
    if (result.error.emailError)
      setError("email", { message: result.error.emailError });
    if (result.error.passwordError)
      setError("password", { message: result.error.passwordError });
    onError?.(result.error.banner ?? null);
  }

  return (
    <View style={{ gap: 16 }}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            variant="card"
            label={t("auth.emailLabel")}
            placeholder={t("auth.emailPlaceholder")}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            ref={passwordRef}
            variant="card"
            label={t("auth.passwordLabel")}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={handleSubmit(onSubmit)}
            error={errors.password?.message}
            rightSlot={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
                }
                hitSlop={12}
              >
                <Text
                  variant="caption"
                  color="textMuted"
                  weight="bold"
                  style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
                >
                  {showPassword
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")}
                </Text>
              </Pressable>
            }
          />
        )}
      />

      <Pressable
        onPress={() => {}}
        accessibilityRole="link"
        hitSlop={8}
        style={{ alignSelf: "flex-end", paddingVertical: 4 }}
      >
        <Text variant="caption" color="textMuted">
          {t("auth.forgotPassword")}
        </Text>
      </Pressable>

      <Button
        label={t("auth.loginCta")}
        onPress={handleSubmit(onSubmit)}
        loading={submitting}
        trailing={
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primaryText} />
        }
      />
    </View>
  );
}
