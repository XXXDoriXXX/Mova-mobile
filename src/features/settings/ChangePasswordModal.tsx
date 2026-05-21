import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { changePassword } from "@/api/auth";
import { extractErrorPayload } from "@/api/client";

type Props = { visible: boolean; onClose: () => void };

export function ChangePasswordModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      toast.success(t("settings.changePasswordSuccess"));
    },
    onError: (err) => {
      const payload = extractErrorPayload(err);
      if (payload?.statusCode === 401) {
        setError(t("settings.changePasswordWrongCurrent"));
      } else if (payload?.error === "WEAK_PASSWORD") {
        setError(t("auth.errorWeakPassword"));
      } else {
        setError(t("auth.errorGeneric"));
      }
    },
  });

  function handleSubmit() {
    setError(null);
    setDone(false);
    if (next.length < 8) {
      setError(t("auth.errorWeakPassword"));
      return;
    }
    if (next !== confirm) {
      setError(t("settings.changePasswordMismatch"));
      return;
    }
    mutation.mutate();
  }

  function handleClose() {
    setDone(false);
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
              onPress={handleClose}
            />
          </View>
          {!done ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t("common.save")}
                onPress={handleSubmit}
                loading={mutation.isPending}
                disabled={!current || !next}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
