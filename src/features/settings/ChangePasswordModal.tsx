import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";

import { useChangePassword } from "./application/useChangePassword";
import { validateNewPassword } from "./application/validateNewPassword";

type Props = { visible: boolean; onClose: () => void };

export function ChangePasswordModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { submitting, done, execute, reset } = useChangePassword();

  async function handleSubmit() {
    setError(null);
    const validation = validateNewPassword(next, confirm);
    if (!validation.ok) {
      setError(
        validation.reason === "tooShort"
          ? t("auth.errorWeakPassword")
          : t("settings.changePasswordMismatch"),
      );
      return;
    }
    const result = await execute(current, next);
    if (result.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
      return;
    }
    setError(
      result.kind === "wrongCurrent"
        ? t("settings.changePasswordWrongCurrent")
        : result.kind === "weakNew"
          ? t("auth.errorWeakPassword")
          : t("auth.errorGeneric"),
    );
  }

  function handleClose() {
    reset();
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={t("settings.changePassword")}
    >
      <View style={{ gap: theme.spacing.md }}>
        {done ? (
          <Text variant="body" color="success">
            {t("settings.changePasswordSuccess")}
          </Text>
        ) : (
          <>
            <TextField
              label={t("settings.changePasswordCurrent")}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextField
              label={t("settings.changePasswordNew")}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
              helperText={t("auth.passwordPlaceholder")}
            />
            <TextField
              label={t("settings.changePasswordConfirm")}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              error={error ?? undefined}
            />
          </>
        )}
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.cancel")}
              variant="secondary"
              size="md"
              onPress={handleClose}
            />
          </View>
          {!done ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t("common.save")}
                size="md"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!current || !next}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
