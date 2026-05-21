import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { deleteAccount } from "@/api/auth";
import { extractErrorPayload } from "@/api/client";
import { useAuthStore } from "@/auth/store";

type Props = { visible: boolean; onClose: () => void };

export function DeleteAccountModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteAccount(password),
    onSuccess: async () => {
      toast.success(t("settings.deleteAccountSuccess"));
      queryClient.clear();
      await clear();
    },
    onError: (err) => {
      const payload = extractErrorPayload(err);
      if (payload?.statusCode === 401) {
        setError(t("settings.deleteAccountWrongPassword"));
      } else {
        setError(t("auth.errorGeneric"));
      }
    },
  });

  function handleClose() {
    setPassword("");
    setError(null);
    onClose();
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
              loading={mutation.isPending}
              disabled={!password}
              onPress={() => {
                setError(null);
                mutation.mutate();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
