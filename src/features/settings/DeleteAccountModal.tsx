import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";

import { useDeleteAccount } from "./application/useDeleteAccount";

type Props = { visible: boolean; onClose: () => void };

export function DeleteAccountModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { submitting, execute } = useDeleteAccount();

  function handleClose() {
    setPassword("");
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    const result = await execute(password);
    if (result.ok) return;
    setError(
      result.kind === "wrongPassword"
        ? t("settings.deleteAccountWrongPassword")
        : t("auth.errorGeneric"),
    );
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={t("settings.deleteAccount")}
    >
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body">{t("settings.deleteAccountWarning")}</Text>
        <TextField
          label={t("settings.deleteAccountPassword")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          error={error ?? undefined}
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.cancel")}
              variant="secondary"
              size="md"
              onPress={handleClose}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("settings.deleteAccountConfirm")}
              variant="danger"
              size="md"
              loading={submitting}
              disabled={!password}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
