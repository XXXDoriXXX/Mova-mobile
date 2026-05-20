import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { patchMe } from "@/api/auth";
import { extractErrorPayload } from "@/api/client";
import { useAuthStore } from "@/auth/store";
import { isE164 } from "@/utils/phone";
import type { Language } from "@/types/api";

type Props = { visible: boolean; onClose: () => void };

export function EditProfileModal({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [language, setLanguage] = useState<Language>(user?.language ?? "uk");
  const [error, setError] = useState<string | null>(null);

  // Re-sync when modal opens with a fresh user snapshot.
  useEffect(() => {
    if (!visible || !user) return;
    setName(user.name);
    setPhone(user.phoneNumber ?? "");
    setLanguage(user.language);
    setError(null);
  }, [visible, user]);

  const mutation = useMutation({
    mutationFn: () =>
      patchMe({
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        language,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      if (updated.language !== i18n.language) {
        void i18n.changeLanguage(updated.language);
      }
      onClose();
    },
    onError: (err) => {
      const payload = extractErrorPayload(err);
      const message = Array.isArray(payload?.message)
        ? payload?.message.join(" ")
        : payload?.message;
      setError(message ?? t("auth.errorGeneric"));
    },
  });

  function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError(t("settings.editProfileNameRequired"));
      return;
    }
    if (phone.trim() && !isE164(phone.trim())) {
      setError(t("preCall.phoneError"));
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t("settings.editProfile")}>
      <View style={{ gap: theme.spacing.md }}>
        <TextField
          label={t("auth.nameLabel")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextField
          label={t("settings.editProfilePhone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          placeholder="+380..."
        />
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label">{t("auth.languageLabel")}</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Chip
              label={t("auth.languageUk")}
              selected={language === "uk"}
              onPress={() => setLanguage("uk")}
            />
            <Chip
              label={t("auth.languageEn")}
              selected={language === "en"}
              onPress={() => setLanguage("en")}
            />
          </View>
        </View>
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.cancel")}
              variant="secondary"
              onPress={onClose}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.save")}
              loading={mutation.isPending}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
