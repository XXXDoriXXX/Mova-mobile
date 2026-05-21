import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Row } from "@/components/Row";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/feedback/toast";
import { registerForPush } from "@/notifications/registration";

/**
 * Self-contained settings entry for push notifications. The backend has no
 * endpoint to receive the token yet, so on success we surface a toast and
 * keep the token in memory only. Once `POST /users/me/push-tokens` exists,
 * forward the token from here.
 *
 * Three terminal states (granted / denied / unsupported) each produce a
 * different toast variant so the user knows what happened without a
 * follow-up alert dialog interrupting them.
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
        toast.success(t("settings.pushSuccessBody"), t("settings.pushSuccessTitle"));
      } else if (result.status === "denied") {
        toast.warning(t("settings.pushDeniedBody"), t("settings.pushDeniedTitle"));
      } else {
        toast.info(t("settings.pushUnsupportedBody"), t("settings.pushUnsupportedTitle"));
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
      trailing={busy ? <Spinner size="small" /> : undefined}
    />
  );
}
