import { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { Row } from "@/components/Row";
import { Spinner } from "@/components/Spinner";
import { registerForPush } from "@/notifications/registration";

/**
 * Self-contained settings entry for push notifications. The backend has no
 * endpoint to receive the token yet, so on success we just surface a toast —
 * the plumbing works end-to-end; once `POST /users/me/push-tokens` exists,
 * forward the token from here.
 */
export function PushNotificationsRow() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "granted" | "denied" | "unsupported">(
    "idle",
  );

  async function handlePress() {
    setBusy(true);
    try {
      const result = await registerForPush();
      setState(result.status);
      if (result.status === "granted") {
        Alert.alert(t("settings.pushSuccessTitle"), t("settings.pushSuccessBody"));
      } else if (result.status === "denied") {
        Alert.alert(
          t("settings.pushDeniedTitle"),
          t("settings.pushDeniedBody"),
        );
      } else {
        Alert.alert(
          t("settings.pushUnsupportedTitle"),
          t("settings.pushUnsupportedBody"),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const subtitle =
    state === "granted"
      ? t("settings.pushSubtitleGranted")
      : state === "denied"
        ? t("settings.pushSubtitleDenied")
        : t("settings.pushSubtitleIdle");

  return (
    <Row
      iconName="notifications-outline"
      title={t("settings.push")}
      subtitle={subtitle}
      onPress={busy ? undefined : handlePress}
      trailing={busy ? <Spinner /> : undefined}
    />
  );
}
