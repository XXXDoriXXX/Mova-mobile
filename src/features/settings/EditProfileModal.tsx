import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/auth/store";
import { sendEmailVerification } from "@/api/auth";
import { toast } from "@/feedback/toast";
import type { Language } from "@/types/api";

import { useEditProfile } from "./application/useEditProfile";

type Props = { visible: boolean; onClose: () => void };

export function EditProfileModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState<Language>(user?.language ?? "uk");
  const [isDeafMute, setIsDeafMute] = useState(user?.isDeafMute ?? true);
  const [error, setError] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  async function handleSendEmail() {
    setEmailBusy(true);
    try {
      await sendEmailVerification();
      toast.success(t("verifyEmail.sent"));
    } catch {
      toast.error(t("verifyEmail.error"));
    } finally {
      setEmailBusy(false);
    }
  }

  const { submitting, execute } = useEditProfile();

  useEffect(() => {
    if (!visible || !user) return;
    setName(user.name);
    setLanguage(user.language);
    setIsDeafMute(user.isDeafMute);
    setError(null);
  }, [visible, user]);

  async function handleSubmit() {
    setError(null);
    if (name.trim().length === 0) {
      setError(t("settings.editProfileNameRequired"));
      return;
    }
    const result = await execute({
      name: name.trim(),
      language,
      isDeafMute,
    });
    if (result.ok) {
      onClose();
    } else {
      setError(result.message);
    }
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
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label">{t("settings.editProfilePhone")}</Text>
          <Text
            variant="body"
            color={user?.phoneNumber ? "text" : "textMuted"}
          >
            {user?.phoneNumber ?? t("verifyPhone.notVerified")}
          </Text>
          <Button
            label={
              user?.phoneNumber
                ? t("verifyPhone.changeVerify")
                : t("verifyPhone.verifyCta")
            }
            variant="secondary"
            size="md"
            onPress={() => {
              onClose();
              router.push("/settings/verify-phone");
            }}
          />
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label">{t("verifyEmail.label")}</Text>
          <Text variant="body">{user?.email ?? ""}</Text>
          <Button
            label={t("verifyEmail.send")}
            variant="secondary"
            size="md"
            loading={emailBusy}
            onPress={handleSendEmail}
          />
        </View>
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
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label">Спосіб спілкування</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Chip
              label="Глухонімий(а)"
              selected={isDeafMute}
              onPress={() => setIsDeafMute(true)}
            />
            <Chip
              label="Чую і розмовляю"
              selected={!isDeafMute}
              onPress={() => setIsDeafMute(false)}
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
              size="md"
              onPress={onClose}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.save")}
              size="md"
              loading={submitting}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
