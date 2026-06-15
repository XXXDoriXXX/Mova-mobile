import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { usePhoneVerification } from "@/features/auth";

export default function VerifyPhoneScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { step, busy, error, phoneNumber, sendCode, verifyCode, reset } =
    usePhoneVerification();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  return (
    <KeyboardScreen>
      <View style={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="title">{t("verifyPhone.title")}</Text>
          <Text variant="body" color="textMuted">
            {t("verifyPhone.subtitle")}
          </Text>
        </View>

        {step === "phone" && (
          <View style={{ gap: theme.spacing.md }}>
            <TextField
              label={t("verifyPhone.phoneLabel")}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+380…"
            />
            <Button
              label={t("verifyPhone.sendCode")}
              loading={busy}
              disabled={phone.trim().length < 6}
              onPress={() => sendCode(phone.trim())}
            />
          </View>
        )}

        {step === "code" && (
          <View style={{ gap: theme.spacing.md }}>
            <TextField
              label={t("verifyPhone.codeLabel")}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
            />
            <Button
              label={t("verifyPhone.verify")}
              loading={busy}
              disabled={code.trim().length < 6}
              onPress={() => verifyCode(code.trim())}
            />
            <Button
              label={t("verifyPhone.changeNumber")}
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setCode("");
                reset();
              }}
            />
          </View>
        )}

        {step === "done" && (
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="body">
              {t("verifyPhone.done", { phone: phoneNumber ?? "" })}
            </Text>
            <Button label={t("common.done")} onPress={() => router.back()} />
          </View>
        )}

        {error ? (
          <Text variant="body" color="danger">
            {t(error)}
          </Text>
        ) : null}
      </View>
    </KeyboardScreen>
  );
}
